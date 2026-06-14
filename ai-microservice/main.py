# ai-microservice/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import re
import nltk
from nltk.corpus import stopwords

# Download stopwords when the server starts
nltk.download('stopwords', quiet=True)
stop_words = set(stopwords.words('english'))

app = FastAPI(title="HGM Sentiment AI")

# 1. Load your 95% accuracy model and vectorizer
print("Loading AI Models...")
with open("salon_svm_model.pkl", "rb") as f:
    model = pickle.load(f)
with open("tfidf_vectorizer_svm.pkl", "rb") as f:
    vectorizer = pickle.load(f)
print("Models loaded successfully!")

# 2. Define the exact input format expected from Node.js
class ReviewInput(BaseModel):
    text: str

# 3. Exact preprocessing function used during Kaggle training
def clean_text(text):
    text = text.lower()
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    tokens = text.split()
    filtered = [w for w in tokens if w not in stop_words]
    return " ".join(filtered)

# Binary labels
label_map = {0: "Negative", 1: "Positive"}

# 4. The API Endpoint
@app.post("/analyze")
def analyze_review(data: ReviewInput):
    # Clean the text
    cleaned_text = clean_text(data.text)
    
    # Transform to mathematical vector
    vectorized_text = vectorizer.transform([cleaned_text])
    
    # Predict Sentiment
    prediction = model.predict(vectorized_text)[0]
    
    return {
        "original_text": data.text,
        "sentiment": label_map[prediction]
    }