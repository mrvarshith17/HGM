# AI Features Extension for main.py
# Add these to your existing ai-microservice/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
from collections import Counter, defaultdict
from datetime import datetime, timedelta
import math

# ============================================================================
# DATA MODELS
# ============================================================================

class RecommendationRequest(BaseModel):
    userId: str
    limit: int = 5

class SmartSearchRequest(BaseModel):
    query: str
    userId: Optional[str] = None

class PricingSuggestionRequest(BaseModel):
    salonId: str

# ============================================================================
# FEATURE 1: SMART RECOMMENDATION ENGINE
# ============================================================================

class RecommendationEngine:
    """Collaborative filtering for salon recommendations"""
    
    def __init__(self, data_dir: str = "../data"):
        self.data_dir = data_dir
        self.bookings = self._load_json("bookings.json")
        self.reviews = self._load_json("reviews.json")
        self.salons = self._load_json("salons.json")
    
    def _load_json(self, filename: str) -> List[Dict]:
        """Safely load JSON data"""
        filepath = os.path.join(self.data_dir, filename)
        try:
            if not os.path.exists(filepath):
                return []
            with open(filepath, 'r') as f:
                return json.load(f) or []
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            return []
    
    def get_recommendations(self, user_id: str, limit: int = 5) -> Dict[str, Any]:
        """Get salon recommendations for a user"""
        
        # 1. Get user's booking history
        user_bookings = [b for b in self.bookings if b.get('userId') == user_id]
        if not user_bookings:
            return {
                "recommendations": self._get_top_rated_salons(limit),
                "reason": "No booking history - showing top rated salons"
            }
        
        user_salon_ids = set(b.get('salonId') for b in user_bookings)
        
        # 2. Find similar users (users who visited same salons)
        similar_users = self._find_similar_users(user_id, user_salon_ids)
        
        # 3. Get salons visited by similar users but not by target user
        similar_user_ids = [u for u in similar_users if u != user_id]
        similar_user_salons = defaultdict(list)  # salon_id -> [ratings]
        
        for booking in self.bookings:
            if booking.get('userId') in similar_user_ids:
                salon_id = booking.get('salonId')
                if salon_id not in user_salon_ids:
                    # Get rating if exists
                    review = next(
                        (r for r in self.reviews 
                         if r.get('bookingId') == booking.get('bookingId')),
                        None
                    )
                    rating = review.get('rating', 0) if review else 0
                    similar_user_salons[salon_id].append(rating)
        
        # 4. Score and rank
        recommendations = []
        for salon_id, ratings in similar_user_salons.items():
            if ratings:
                avg_rating = sum(ratings) / len(ratings)
                salon = next(
                    (s for s in self.salons if s.get('id') == salon_id),
                    None
                )
                if salon:
                    recommendations.append({
                        "salonId": salon_id,
                        "salonName": salon.get('name', 'Unknown'),
                        "predictedRating": round(avg_rating, 1),
                        "similarUsersCount": len(ratings),
                        "location": salon.get('city', 'Unknown'),
                        "reason": f"{len(ratings)} similar users rated this {round(avg_rating, 1)} stars"
                    })
        
        # Sort by rating
        recommendations.sort(key=lambda x: x['predictedRating'], reverse=True)
        
        return {
            "userId": user_id,
            "recommendations": recommendations[:limit],
            "totalFound": len(recommendations),
            "basedOnSimilarUsers": len(similar_user_ids)
        }
    
    def _find_similar_users(self, user_id: str, salon_ids: set, threshold: int = 1) -> List[str]:
        """Find users with similar booking patterns"""
        similar = set()
        
        for booking in self.bookings:
            if booking.get('userId') != user_id:
                if booking.get('salonId') in salon_ids:
                    similar.add(booking.get('userId'))
        
        return list(similar) if similar else self._get_active_users(limit=5)
    
    def _get_active_users(self, limit: int = 5) -> List[str]:
        """Get most active users"""
        user_counts = Counter(b.get('userId') for b in self.bookings)
        return [u for u, _ in user_counts.most_common(limit)]
    
    def _get_top_rated_salons(self, limit: int = 5) -> List[Dict]:
        """Get top rated salons (fallback)"""
        salon_ratings = defaultdict(list)
        
        for review in self.reviews:
            salon_id = review.get('salonId')
            rating = review.get('rating', 0)
            salon_ratings[salon_id].append(rating)
        
        top_salons = []
        for salon_id, ratings in salon_ratings.items():
            if ratings:
                salon = next(
                    (s for s in self.salons if s.get('id') == salon_id),
                    None
                )
                if salon:
                    top_salons.append({
                        "salonId": salon_id,
                        "salonName": salon.get('name'),
                        "predictedRating": round(sum(ratings) / len(ratings), 1),
                        "location": salon.get('city'),
                        "reason": "Top rated salon"
                    })
        
        top_salons.sort(key=lambda x: x['predictedRating'], reverse=True)
        return top_salons[:limit]

# ============================================================================
# FEATURE 2: NLP SMART SEARCH CHATBOT
# ============================================================================

class SmartSearchEngine:
    """NLP-based search parsing"""
    
    def __init__(self, data_dir: str = "../data"):
        self.data_dir = data_dir
        self.salons = self._load_json("salons.json")
        self.services_mapping = self._build_service_mapping()
        self.cities_mapping = self._build_cities_mapping()
    
    def _load_json(self, filename: str) -> List[Dict]:
        filepath = os.path.join(self.data_dir, filename)
        try:
            if not os.path.exists(filepath):
                return []
            with open(filepath, 'r') as f:
                return json.load(f) or []
        except:
            return []
    
    def _build_service_mapping(self) -> Dict[str, str]:
        """Build lowercase service name mapping"""
        mapping = {}
        for salon in self.salons:
            services = salon.get('services', [])
            if isinstance(services, list):
                for service in services:
                    mapping[service.lower()] = service
        return mapping
    
    def _build_cities_mapping(self) -> Dict[str, str]:
        """Build lowercase city mapping"""
        mapping = {}
        for salon in self.salons:
            city = salon.get('city', '').lower()
            if city:
                mapping[city] = salon.get('city')
        return mapping
    
    def parse_query(self, query: str) -> Dict[str, Any]:
        """Extract filters from natural language query"""
        query_lower = query.lower()
        
        filters = {
            "location": None,
            "services": [],
            "max_price": None,
            "min_rating": 0,
            "keywords": []
        }
        
        # Extract location (city names)
        for city_lower, city_name in self.cities_mapping.items():
            if city_lower in query_lower:
                filters["location"] = city_name
                break
        
        # Extract services
        for service_lower, service_name in self.services_mapping.items():
            if service_lower in query_lower:
                filters["services"].append(service_name)
        
        # Extract price (look for "under ₹XXXX", "under XXXX", "<XXXX")
        import re
        price_patterns = [
            r'under\s*₹?\s*(\d+)',
            r'less\s*than\s*₹?\s*(\d+)',
            r'<\s*₹?\s*(\d+)',
            r'₹?\s*(\d+)\s*budget'
        ]
        for pattern in price_patterns:
            match = re.search(pattern, query_lower)
            if match:
                filters["max_price"] = int(match.group(1))
                break
        
        # Extract minimum rating
        rating_patterns = [
            r'(\d+)\s*\+\s*star',
            r'(\d+)\s*star\s*\+',
            r'rating\s*(?:of\s*)?(\d+)'
        ]
        for pattern in rating_patterns:
            match = re.search(pattern, query_lower)
            if match:
                filters["min_rating"] = int(match.group(1))
                break
        
        # Extract remaining keywords
        stop_words = {'the', 'a', 'an', 'in', 'for', 'with', 'that', 'is', 'and', 'or', 'find', 'me', 'salons', 'salon', 'does', 'do', 'under', 'star', 'rating', 'to', 'be'}
        words = [w for w in query_lower.split() if len(w) > 2 and w not in stop_words]
        filters["keywords"] = words
        
        return filters
    
    def search(self, query: str) -> Dict[str, Any]:
        """Perform smart search"""
        filters = self.parse_query(query)
        
        # Apply filters to salons
        results = self.salons
        
        # Filter by location
        if filters["location"]:
            results = [s for s in results if s.get('city', '').lower() == filters["location"].lower()]
        
        # Filter by services
        if filters["services"]:
            filtered = []
            for salon in results:
                services = [s.lower() for s in salon.get('services', [])]
                if any(fs.lower() in services for fs in filters["services"]):
                    filtered.append(salon)
            results = filtered
        
        # Filter by price (using average service price estimation)
        if filters["max_price"]:
            results = [s for s in results if s.get('price', float('inf')) <= filters["max_price"]]
        
        # Filter by rating
        if filters["min_rating"] > 0:
            results = [s for s in results if s.get('rating', 0) >= filters["min_rating"]]
        
        return {
            "extractedFilters": filters,
            "matchingSalons": results[:10],
            "totalMatched": len(results),
            "query": query
        }

# ============================================================================
# FEATURE 3: DYNAMIC PRICING SUGGESTIONS
# ============================================================================

class DynamicPricingEngine:
    """Analyze booking patterns and suggest prices"""
    
    def __init__(self, data_dir: str = "../data"):
        self.data_dir = data_dir
        self.bookings = self._load_json("bookings.json")
        self.salons = self._load_json("salons.json")
    
    def _load_json(self, filename: str) -> List[Dict]:
        filepath = os.path.join(self.data_dir, filename)
        try:
            if not os.path.exists(filepath):
                return []
            with open(filepath, 'r') as f:
                return json.load(f) or []
        except:
            return []
    
    def get_suggestions(self, salon_id: str) -> Dict[str, Any]:
        """Get pricing suggestions for a salon"""
        
        # Get bookings for this salon
        salon_bookings = [b for b in self.bookings if b.get('salonId') == salon_id]
        
        if not salon_bookings:
            return {
                "salonId": salon_id,
                "message": "No booking data available",
                "suggestions": []
            }
        
        # Analyze by day and hour
        hourly_analysis = defaultdict(lambda: defaultdict(list))
        
        for booking in salon_bookings:
            date_str = booking.get('appointmentDate')
            time_str = booking.get('appointmentTime')
            status = booking.get('status', 'unknown')
            
            if date_str and time_str:
                try:
                    date_obj = datetime.fromisoformat(date_str)
                    day_name = date_obj.strftime('%A')
                    hour = int(time_str.split(':')[0])
                    
                    hourly_analysis[day_name][hour].append({
                        'status': status,
                        'timestamp': booking.get('createdAt')
                    })
                except:
                    pass
        
        # Calculate occupancy and suggestions
        suggestions = []
        total_slots = 0
        booked_slots = 0
        
        for day, hours in hourly_analysis.items():
            for hour, bookings in hours.items():
                total_slots += 1
                completed = len([b for b in bookings if b['status'] == 'completed'])
                booked_slots += completed
                
                occupancy_pct = (completed / len(bookings) * 100) if bookings else 0
                
                if occupancy_pct < 30:
                    discount = 15  # Suggest 15% discount for low occupancy
                    revenue_impact = f"+₹{math.ceil(occupancy_pct * 100)}/slot"
                    suggestion_text = "Offer discount to fill slots"
                elif occupancy_pct < 60:
                    discount = 10
                    revenue_impact = f"+₹{math.ceil(occupancy_pct * 50)}/slot"
                    suggestion_text = "Minor discount recommended"
                else:
                    discount = 0
                    revenue_impact = "Optimal occupancy"
                    suggestion_text = "Peak hours - no discount needed"
                
                suggestions.append({
                    "day": day,
                    "hour": f"{hour:02d}:00",
                    "bookings": len(bookings),
                    "occupancy_percentage": round(occupancy_pct, 1),
                    "recommended_discount": f"{discount}%" if discount > 0 else "0%",
                    "suggestion": suggestion_text,
                    "estimated_revenue_impact": revenue_impact
                })
        
        # Calculate overall metrics
        overall_occupancy = (booked_slots / total_slots * 100) if total_slots > 0 else 0
        estimated_revenue_increase = math.ceil(overall_occupancy * 500)  # ₹500 per % increase
        
        return {
            "salonId": salon_id,
            "overallOccupancy": round(overall_occupancy, 1),
            "totalSlots": total_slots,
            "bookedSlots": booked_slots,
            "suggestions": suggestions,
            "estimatedRevenueIncrease": f"₹{estimated_revenue_increase}/month with smart pricing"
        }

# ============================================================================
# INITIALIZE ENGINES
# ============================================================================

recommendation_engine = RecommendationEngine()
search_engine = SmartSearchEngine()
pricing_engine = DynamicPricingEngine()

# ============================================================================
# API ENDPOINTS (Add to your existing FastAPI app)
# ============================================================================

# Add these routes to your main.py FastAPI app instance

@app.post("/recommendations")
def get_recommendations(request: RecommendationRequest):
    """Get personalized salon recommendations for a user"""
    try:
        result = recommendation_engine.get_recommendations(request.userId, request.limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/smart-search")
def smart_search(request: SmartSearchRequest):
    """Parse natural language search query"""
    try:
        result = search_engine.search(request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pricing-suggestions")
def pricing_suggestions(request: PricingSuggestionRequest):
    """Get dynamic pricing suggestions for a salon"""
    try:
        result = pricing_engine.get_suggestions(request.salonId)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
