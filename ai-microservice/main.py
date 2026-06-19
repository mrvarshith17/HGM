# ai-microservice/main.py
# Extended with AI Features: Recommendations, Smart Search, Dynamic Pricing

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import re
import nltk
from nltk.corpus import stopwords
import json
import os
from collections import Counter, defaultdict
from datetime import datetime
import math
from typing import List, Optional, Dict, Any

# Download stopwords when the server starts
nltk.download('stopwords', quiet=True)
stop_words = set(stopwords.words('english'))

app = FastAPI(title="HGM Salon AI Engine")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# FEATURE 0: SENTIMENT ANALYSIS (Original)
# ============================================================================

print("Loading AI Models...")
try:
    with open("salon_svm_model.pkl", "rb") as f:
        sentiment_model = pickle.load(f)
    with open("tfidf_vectorizer_svm.pkl", "rb") as f:
        sentiment_vectorizer = pickle.load(f)
    print("✓ Sentiment models loaded successfully!")
except Exception as e:
    print(f"⚠ Sentiment models not found: {e}")
    sentiment_model = None
    sentiment_vectorizer = None

label_map = {0: "Negative", 1: "Positive"}

class ReviewInput(BaseModel):
    text: str

def clean_text(text):
    text = text.lower()
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    tokens = text.split()
    filtered = [w for w in tokens if w not in stop_words]
    return " ".join(filtered)

@app.post("/analyze")
def analyze_review(data: ReviewInput):
    """Analyze review sentiment using SVM model"""
    if sentiment_model is None or sentiment_vectorizer is None:
        raise HTTPException(status_code=500, detail="Sentiment model not loaded")
    
    cleaned_text = clean_text(data.text)
    vectorized_text = sentiment_vectorizer.transform([cleaned_text])
    prediction = sentiment_model.predict(vectorized_text)[0]
    
    return {
        "original_text": data.text,
        "sentiment": label_map[prediction]
    }

# ============================================================================
# FEATURE 1: SMART RECOMMENDATION ENGINE
# ============================================================================

class RecommendationEngine:
    """Collaborative filtering for salon recommendations"""
    
    def __init__(self, data_dir: str = "."):
        self.data_dir = data_dir
        self.bookings = self._load_json("../data/bookings.json")
        self.reviews = self._load_json("../data/reviews.json")
        self.salons = self._load_json("../data/salons.json")
        print(f"✓ Recommendations: Loaded {len(self.bookings)} bookings, {len(self.reviews)} reviews, {len(self.salons)} salons")
    
    def _load_json(self, filepath: str) -> List[Dict]:
        try:
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    data = json.load(f)
                    return data if isinstance(data, list) else []
            return []
        except Exception as e:
            print(f"Error loading {filepath}: {e}")
            return []
    
    def get_recommendations(self, user_id: str, limit: int = 5) -> Dict[str, Any]:
        user_bookings = [b for b in self.bookings if b.get('userId') == user_id]
        
        if not user_bookings:
            return {
                "recommendations": self._get_top_rated_salons(limit),
                "reason": "No booking history - showing top rated salons",
                "basedOnSimilarUsers": 0
            }
        
        user_salon_ids = set(b.get('salonId') for b in user_bookings)
        similar_users = self._find_similar_users(user_id, user_salon_ids)
        similar_user_ids = [u for u in similar_users if u != user_id]
        
        similar_user_salons = defaultdict(list)
        for booking in self.bookings:
            if booking.get('userId') in similar_user_ids:
                salon_id = booking.get('salonId')
                if salon_id not in user_salon_ids:
                    review = next(
                        (r for r in self.reviews if r.get('bookingId') == booking.get('bookingId')),
                        None
                    )
                    rating = review.get('rating', 3) if review else 3
                    similar_user_salons[salon_id].append(rating)
        
        recommendations = []
        for salon_id, ratings in similar_user_salons.items():
            avg_rating = sum(ratings) / len(ratings)
            salon = next((s for s in self.salons if s.get('id') == salon_id), None)
            if salon:
                recommendations.append({
                    "salonId": salon_id,
                    "salonName": salon.get('name'),
                    "predictedRating": round(avg_rating, 1),
                    "similarUsersCount": len(ratings),
                    "location": salon.get('city'),
                    "reason": f"{len(ratings)} users like you gave this {round(avg_rating, 1)}★"
                })
        
        recommendations.sort(key=lambda x: x['predictedRating'], reverse=True)
        
        return {
            "userId": user_id,
            "recommendations": recommendations[:limit],
            "totalFound": len(recommendations),
            "basedOnSimilarUsers": len(similar_user_ids)
        }
    
    def _find_similar_users(self, user_id: str, salon_ids: set) -> List[str]:
        similar = set()
        for booking in self.bookings:
            if booking.get('userId') != user_id and booking.get('salonId') in salon_ids:
                similar.add(booking.get('userId'))
        return list(similar) if similar else self._get_active_users(limit=5)
    
    def _get_active_users(self, limit: int = 5) -> List[str]:
        user_counts = Counter(b.get('userId') for b in self.bookings)
        return [u for u, _ in user_counts.most_common(limit)]
    
    def _get_top_rated_salons(self, limit: int = 5) -> List[Dict]:
        salon_ratings = defaultdict(list)
        for review in self.reviews:
            salon_id = review.get('salonId')
            rating = review.get('rating', 0)
            salon_ratings[salon_id].append(rating)
        
        top_salons = []
        for salon_id, ratings in salon_ratings.items():
            if ratings:
                salon = next((s for s in self.salons if s.get('id') == salon_id), None)
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
# FEATURE 2: NLP SMART SEARCH
# ============================================================================

class SmartSearchEngine:
    """NLP-based search parsing"""
    
    def __init__(self):
        self.salons = self._load_json("../data/salons.json")
        self.services_mapping = self._build_service_mapping()
        self.cities_mapping = self._build_cities_mapping()
        print(f"✓ Smart Search: Ready with {len(self.salons)} salons")
    
    def _load_json(self, filepath: str) -> List[Dict]:
        try:
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    return json.load(f) or []
            return []
        except:
            return []
    
    def _build_service_mapping(self) -> Dict[str, str]:
        mapping = {}
        for salon in self.salons:
            services = salon.get('services', [])
            if isinstance(services, list):
                for service in services:
                    mapping[service.lower()] = service
        return mapping
    
    def _build_cities_mapping(self) -> Dict[str, str]:
        mapping = {}
        for salon in self.salons:
            city = salon.get('city', '').lower()
            if city:
                mapping[city] = salon.get('city')
        return mapping
    
    def parse_query(self, query: str) -> Dict[str, Any]:
        """Extract filters from natural language"""
        query_lower = query.lower()
        filters = {"location": None, "services": [], "max_price": None, "min_rating": 0, "keywords": []}
        
        # Extract location - try both city names and area names
        for city_lower, city_name in self.cities_mapping.items():
            if city_lower in query_lower:
                filters["location"] = city_lower  # Store the lowercased version for flexible matching
                break
        
        # Also check for common area names even if not in cities mapping
        if not filters["location"]:
            # Common areas/localities to check
            common_areas = ['kondapur', 'hyderabad', 'chennai', 'bangalore', 'delhi', 'mumbai', 'pune', 'gurgaon', 'noida']
            for area in common_areas:
                if area in query_lower:
                    filters["location"] = area
                    break
        
        # Extract services
        for service_lower, service_name in self.services_mapping.items():
            if service_lower in query_lower:
                filters["services"].append(service_name)
        
        # Extract price
        import re
        price_patterns = [r'under\s*₹?\s*(\d+)', r'less\s*than\s*₹?\s*(\d+)', r'<\s*₹?\s*(\d+)']
        for pattern in price_patterns:
            match = re.search(pattern, query_lower)
            if match:
                filters["max_price"] = int(match.group(1))
                break
        
        # Extract rating
        rating_patterns = [r'(\d+)\s*\+\s*star', r'(\d+)\s*star\s*\+']
        for pattern in rating_patterns:
            match = re.search(pattern, query_lower)
            if match:
                filters["min_rating"] = int(match.group(1))
                break
        
        return filters
    
    def search(self, query: str) -> Dict[str, Any]:
        """Perform smart search"""
        filters = self.parse_query(query)
        results = self.salons
        
        # Filter by location (check both city and address)
        if filters["location"]:
            location_query = filters["location"].lower()
            results = [
                s for s in results 
                if location_query in s.get('city', '').lower() or 
                   location_query in s.get('address', '').lower()
            ]
        
        # Filter by services
        if filters["services"]:
            filtered = []
            for salon in results:
                services = [s.lower() for s in salon.get('services', [])]
                if any(fs.lower() in services for fs in filters["services"]):
                    filtered.append(salon)
            results = filtered
        
        # Filter by price
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
# FEATURE 3: DYNAMIC PRICING
# ============================================================================

class DynamicPricingEngine:
    """Analyze booking patterns"""
    
    def __init__(self):
        self.bookings = self._load_json("../data/bookings.json")
        self.salons = self._load_json("../data/salons.json")
        print(f"✓ Dynamic Pricing: Ready with {len(self.bookings)} bookings")
    
    def _load_json(self, filepath: str) -> List[Dict]:
        try:
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    return json.load(f) or []
            return []
        except:
            return []
    
    def get_suggestions(self, salon_id: str) -> Dict[str, Any]:
        salon_bookings = [b for b in self.bookings if b.get('salonId') == salon_id]
        
        if not salon_bookings:
            return {"salonId": salon_id, "message": "No booking data", "suggestions": []}
        
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
                    hourly_analysis[day_name][hour].append(status)
                except:
                    pass
        
        suggestions = []
        total = 0
        completed = 0
        
        for day, hours in hourly_analysis.items():
            for hour, statuses in hours.items():
                total += len(statuses)
                comp = len([s for s in statuses if s == 'completed'])
                completed += comp
                occ = (comp / len(statuses) * 100) if statuses else 0
                
                discount = 15 if occ < 30 else (10 if occ < 60 else 0)
                
                suggestions.append({
                    "day": day,
                    "hour": f"{hour:02d}:00",
                    "bookings": len(statuses),
                    "occupancy": round(occ, 1),
                    "recommended_discount": f"{discount}%"
                })
        
        overall = (completed / total * 100) if total > 0 else 0
        revenue = math.ceil(overall * 500)
        
        return {
            "salonId": salon_id,
            "overallOccupancy": round(overall, 1),
            "suggestions": suggestions[:7],  # Show top 7
            "estimatedRevenueIncrease": f"₹{revenue}/month"
        }

# ============================================================================
# INITIALIZE ENGINES
# ============================================================================

recommendation_engine = RecommendationEngine()
search_engine = SmartSearchEngine()
pricing_engine = DynamicPricingEngine()

# ============================================================================
# API ENDPOINTS
# ============================================================================

class RecommendationRequest(BaseModel):
    userId: str
    limit: int = 5

class SmartSearchRequest(BaseModel):
    query: str

class PricingRequest(BaseModel):
    salonId: str

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "OK", "service": "HGM Salon AI Engine"}

@app.post("/recommendations")
def get_recommendations(request: RecommendationRequest):
    """Get personalized salon recommendations"""
    try:
        result = recommendation_engine.get_recommendations(request.userId, request.limit)
        return result
    except Exception as e:
        print(f"Recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/smart-search")
def smart_search(request: SmartSearchRequest):
    """Parse natural language search query"""
    try:
        result = search_engine.search(request.query)
        return result
    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pricing-suggestions")
def get_pricing_suggestions(request: PricingRequest):
    """Get dynamic pricing suggestions"""
    try:
        result = pricing_engine.get_suggestions(request.salonId)
        return result
    except Exception as e:
        print(f"Pricing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# STARTUP MESSAGE
# ============================================================================

@app.on_event("startup")
async def startup():
    print("\n" + "="*60)
    print("🚀 HGM Salon AI Engine Started")
    print("="*60)
    print("✓ Sentiment Analysis (Original)")
    print("✓ Smart Recommendation Engine")
    print("✓ NLP Smart Search Chatbot")
    print("✓ Dynamic Pricing Suggestions")
    print("="*60)
    print("API Endpoints:")
    print("  POST /analyze - Analyze review sentiment")
    print("  POST /recommendations - Get personalized recommendations")
    print("  POST /smart-search - Natural language search")
    print("  POST /pricing-suggestions - Dynamic pricing advice")
    print("="*60 + "\n")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
