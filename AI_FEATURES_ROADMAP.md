# AI Features Implementation Roadmap

## Overview
You'll add 3 AI features to your app by extending the Python microservice that's already running.

## Architecture

```
Frontend (Next.js)
    ↓
Next.js API Routes (/api/*)
    ↓
Python Microservice (FastAPI) on port 8000
    ↓
Data Files (bookings.json, reviews.json, salons.json)
```

## Feature 1: Smart Recommendation Engine (PRIORITY 1)

### What It Does
- Analyzes a user's past bookings and reviews
- Finds similar users (collaborative filtering)
- Recommends salons they haven't visited based on what similar users liked

### Data Needed
- `userId`: User making the request
- User's booking history
- User's ratings/reviews
- Other users' patterns

### ML Approach
- **Similarity**: Compare users based on salons they've visited and ratings
- **Scoring**: Rate salons based on rating from similar users
- **Ranking**: Return top 5-10 salons

### Output
```json
{
  "recommendations": [
    {
      "salonId": "...",
      "salonName": "Spa XYZ",
      "reason": "Users like you rated this 4.8 stars",
      "predictedRating": 4.8,
      "similarUsersCount": 5
    }
  ]
}
```

## Feature 2: NLP Search Chatbot (PRIORITY 2)

### What It Does
- User types: *"Find me a salon in Gachibowli that does Keratin treatments for under ₹2000 with 4+ stars"*
- AI extracts: location, service, price, rating
- Returns matching salons

### ML Approach
- **NER (Named Entity Recognition)**: Extract location, service, numbers
- **Intent Classification**: Understand user wants "search filtered"
- **Entity Linking**: Map "Keratin" → service ID
- **Rule-based Filtering**: Apply extracted filters to salon DB

### Output
```json
{
  "extracted_filters": {
    "location": "Gachibowli",
    "service": "Keratin treatments",
    "max_price": 2000,
    "min_rating": 4
  },
  "matching_salons": [...]
}
```

## Feature 3: Dynamic Pricing Suggestions (PRIORITY 3)

### What It Does
- Analyzes booking patterns by time/day
- Shows salon owners: "On Mondays 10-12am you're empty 40% of the time"
- Suggests: "Offer 20% discount to get more bookings"

### Data Needed
- Bookings with appointmentDate & appointmentTime
- Historical availability
- Salon's target occupancy

### ML Approach
- **Time Series Analysis**: Group bookings by hour/day
- **Demand Forecasting**: Predict busy/slow hours
- **Optimization**: Suggest discount to maximize revenue

### Output
```json
{
  "salonId": "...",
  "hourly_analysis": {
    "Monday": {
      "10:00": {"bookings": 1, "occupancy": 20%, "suggestion": "20% discount"},
      "14:00": {"bookings": 5, "occupancy": 100%, "suggestion": "No discount needed"}
    }
  },
  "estimated_revenue_increase": "₹5000/month"
}
```

---

## Implementation Steps

### Phase 1: Setup (TODAY)
1. ✅ Extend Python microservice with new endpoints
2. ✅ Create API routes in Next.js
3. ✅ Add database queries for data

### Phase 2: Build Recommendation Engine (WEEK 1)
1. Implement user similarity calculation
2. Add collaborative filtering
3. API endpoint: `POST /api/recommendations`

### Phase 3: Build NLP Chatbot (WEEK 2)
1. Add NLP library (spacy)
2. Train/configure intent extraction
3. API endpoint: `POST /api/smart-search`

### Phase 4: Build Dynamic Pricing (WEEK 3)
1. Implement time series analysis
2. Add demand forecasting
3. API endpoint: `POST /api/pricing-suggestions`

---

## Tech Stack

| Feature | Libraries | Time |
|---------|-----------|------|
| Recommendations | scikit-learn, pandas | 4-6 hours |
| NLP Chatbot | spacy, textblob | 6-8 hours |
| Dynamic Pricing | pandas, numpy | 4-5 hours |

---

## Data Requirements

### For Recommendations
✅ You have:
- `bookings.json` - User→Salon mapping
- `reviews.json` - Ratings

### For NLP
✅ You have:
- Service names in salons.json
- Location data

### For Pricing
✅ You have:
- `appointmentDate` & `appointmentTime`
- `status` (to filter completed bookings)

---

## Next Steps

Pick one to start with:
- **Option A**: Start with Recommendations (easiest, most impactful)
- **Option B**: Start with NLP (most visible to users)
- **Option C**: Start with Pricing (most valuable for owners)

---

## Quick Start Commands

```bash
# Install Python dependencies
cd ai-microservice
pip install scikit-learn pandas spacy

# Start microservice
uvicorn main:app --reload --port 8000

# In Next.js, call endpoints like:
# POST http://localhost:8000/recommendations
# POST http://localhost:8000/smart-search
# POST http://localhost:8000/pricing-suggestions
```

---

## Benefits

| Feature | User Benefit | Business Benefit |
|---------|-------------|-----------------|
| Recommendations | Discovers salons they'll love | 25-40% more bookings |
| NLP Chatbot | Faster search experience | Reduced bounce rate |
| Dynamic Pricing | Owners optimize revenue | Higher owner retention |
