from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import numpy as np
from datetime import datetime
import os
from dotenv import load_dotenv

# Import our modules
from model import PricePredictionModel
from features import FeatureEngineer
from scraper import PropertyScraper

load_dotenv()

app = FastAPI(title="Land Price Prediction API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
model = PricePredictionModel()
feature_engineer = FeatureEngineer(google_maps_api_key=os.getenv('GOOGLE_MAPS_API_KEY'))
scraper = PropertyScraper()

class PredictionRequest(BaseModel):
    area_sqft: float
    latitude: float
    longitude: float
    district: str
    state: str
    land_type: str
    pincode: Optional[str] = None
    road_width: Optional[float] = None
    electricity: Optional[bool] = True
    water_supply: Optional[bool] = True

class PredictionResponse(BaseModel):
    predicted_price: float
    price_per_sqft: float
    confidence_score: float
    confidence_interval: Dict[str, float]
    key_factors: Dict[str, str]
    market_insights: Dict[str, Any]

@app.get("/")
async def root():
    return {"message": "Land Price Prediction API", "status": "running"}

@app.post("/predict", response_model=PredictionResponse)
async def predict_price(request: PredictionRequest):
    try:
        print(f"Received prediction request: {request.dict()}")
        
        # Engineer features
        try:
            features = await feature_engineer.create_features(
                area_sqft=request.area_sqft,
                latitude=request.latitude,
                longitude=request.longitude,
                district=request.district,
                state=request.state,
                land_type=request.land_type,
                pincode=request.pincode,
                road_width=request.road_width,
                electricity=request.electricity,
                water_supply=request.water_supply
            )
            print(f"Features created: {features}")
        except Exception as e:
            print(f"Feature engineering error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Feature engineering failed: {str(e)}")
        
        # Get prediction
        try:
            prediction = model.predict(features)
            print(f"Prediction result: {prediction}")
        except Exception as e:
            print(f"Model prediction error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Model prediction failed: {str(e)}")
        
        # Get market data for context (optional, don't fail if this errors)
        market_data = {}
        try:
            market_data = await scraper.get_market_data(
                district=request.district,
                state=request.state,
                land_type=request.land_type
            )
        except Exception as e:
            print(f"Market data error (non-fatal): {str(e)}")
            market_data = {"market_activity": "Active", "growth_rate": 8}
        
        return PredictionResponse(
            predicted_price=float(prediction['price']),
            price_per_sqft=float(prediction['price_per_sqft']),
            confidence_score=float(prediction['confidence']),
            confidence_interval={
                'min': float(prediction['price_min']),
                'max': float(prediction['price_max'])
            },
            key_factors=prediction['factors'],
            market_insights=market_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scrape/update-data")
async def update_market_data(district: str, state: str):
    """Trigger data scraping for a specific location"""
    try:
        results = await scraper.scrape_all_sources(district, state)
        return {"message": "Data updated successfully", "records_added": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model.is_loaded(),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
