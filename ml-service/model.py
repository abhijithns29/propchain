import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os
from typing import Dict, List

class PricePredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'area_sqft', 'latitude', 'longitude',
            'distance_to_city', 'distance_to_highway', 'distance_to_metro',
            'distance_to_school', 'distance_to_hospital',
            'road_width', 'electricity', 'water_supply',
            'avg_price_in_area', 'land_type_encoded'
        ]
        self.load_model()
    
    def load_model(self):
        """Load pre-trained model or create new one"""
        model_path = 'trained_model.pkl'
        scaler_path = 'scaler.pkl'
        property_encoder_path = 'property_type_encoder.pkl'
        district_encoder_path = 'district_encoder.pkl'
        feature_names_path = 'feature_names.pkl'
        
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            
            # Load encoders if they exist
            if os.path.exists(property_encoder_path):
                self.property_encoder = joblib.load(property_encoder_path)
            if os.path.exists(district_encoder_path):
                self.district_encoder = joblib.load(district_encoder_path)
            if os.path.exists(feature_names_path):
                self.trained_feature_names = joblib.load(feature_names_path)
            
            print("✅ Trained model loaded successfully")
        else:
            # Initialize with default model
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=20,
                min_samples_split=5,
                random_state=42
            )
            self.property_encoder = None
            self.district_encoder = None
            self.trained_feature_names = None
            print("Initialized new model - needs training")
    
    def train(self, X: pd.DataFrame, y: pd.Series):
        """Train the model with data"""
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        
        print(f"Training R² score: {train_score:.3f}")
        print(f"Testing R² score: {test_score:.3f}")
        
        # Save model
        joblib.dump(self.model, 'trained_model.pkl')
        joblib.dump(self.scaler, 'scaler.pkl')
        
        return {'train_score': train_score, 'test_score': test_score}
    
    def predict(self, features: Dict) -> Dict:
        """Make price prediction"""
        # Check if scaler is fitted (model has been trained)
        try:
            # Try to use the scaler - if not fitted, this will raise an exception
            if not hasattr(self.scaler, 'mean_'):
                raise AttributeError("Scaler not fitted")
            
            # Prepare features
            feature_vector = np.array([[
                features.get(name, 0) for name in self.feature_names
            ]])
            
            # Scale and predict
            feature_vector_scaled = self.scaler.transform(feature_vector)
            predicted_price = self.model.predict(feature_vector_scaled)[0]
            
            # Calculate confidence based on feature quality
            confidence = self._calculate_confidence(features)
            
            # Calculate price range (confidence interval)
            price_range = predicted_price * 0.15  # ±15%
            
            # Determine key factors
            key_factors = self._analyze_factors(features, predicted_price)
            
            return {
                'price': predicted_price,
                'price_per_sqft': predicted_price / features['area_sqft'],
                'confidence': confidence,
                'price_min': predicted_price - price_range,
                'price_max': predicted_price + price_range,
                'factors': key_factors
            }
        except (AttributeError, Exception) as e:
            # Model not trained yet, use heuristic
            print(f"Using heuristic prediction: {str(e)}")
            return self._heuristic_prediction(features)
    
    def _heuristic_prediction(self, features: Dict) -> Dict:
        """Simple rule-based prediction when model not available"""
        # Base price per sqft by state/district
        base_prices = {
            'Kerala': {'Ernakulam': 3000, 'Thiruvananthapuram': 2800, 'Kozhikode': 2500},
            'Karnataka': {'Bangalore': 4500, 'Mysore': 2000},
            'Tamil Nadu': {'Chennai': 4000, 'Coimbatore': 2200}
        }
        
        state = features.get('state', 'Kerala')
        district = features.get('district', 'Ernakulam')
        base_price = base_prices.get(state, {}).get(district, 2000)
        
        # Adjust for proximity factors
        if features.get('distance_to_city', 100) < 5:
            base_price *= 1.3
        if features.get('distance_to_metro', 100) < 2:
            base_price *= 1.2
        
        # Adjust for infrastructure
        if features.get('electricity') and features.get('water_supply'):
            base_price *= 1.1
        
        predicted_price = base_price * features['area_sqft']
        
        return {
            'price': predicted_price,
            'price_per_sqft': base_price,
            'confidence': 0.6,  # Lower confidence for heuristic
            'price_min': predicted_price * 0.8,
            'price_max': predicted_price * 1.2,
            'factors': {
                'location': 'moderate_impact',
                'infrastructure': 'positive' if features.get('electricity') else 'needs_improvement',
                'note': 'Prediction based on market averages (model training in progress)'
            }
        }
    
    def _calculate_confidence(self, features: Dict) -> float:
        """Calculate prediction confidence score"""
        confidence = 0.7  # Base confidence
        
        # Increase confidence if we have good location data
        if features.get('distance_to_city') is not None:
            confidence += 0.1
        if features.get('avg_price_in_area') is not None:
            confidence += 0.15
        
        return min(confidence, 0.95)
    
    def _analyze_factors(self, features: Dict, predicted_price: float) -> Dict:
        """Analyze key factors affecting price"""
        factors = {}
        
        # Location impact
        if features.get('distance_to_city', 100) < 5:
            factors['location'] = 'high_value_area'
        elif features.get('distance_to_city', 100) < 15:
            factors['location'] = 'moderate_area'
        else:
            factors['location'] = 'peripheral_area'
        
        # Metro proximity
        if features.get('distance_to_metro', 100) < 2:
            factors['metro_access'] = 'excellent'
        
        # Infrastructure
        if features.get('electricity') and features.get('water_supply'):
            factors['infrastructure'] = 'well_developed'
        
        return factors
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.model is not None
