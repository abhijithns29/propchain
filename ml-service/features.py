import googlemaps
from typing import Dict, Optional
import os

class FeatureEngineer:
    def __init__(self, google_maps_api_key: Optional[str] = None):
        self.gmaps = None
        if google_maps_api_key:
            self.gmaps = googlemaps.Client(key=google_maps_api_key)
        
        # Land type encoding
        self.land_type_map = {
            'RESIDENTIAL': 1,
            'COMMERCIAL': 2,
            'AGRICULTURAL': 3,
            'INDUSTRIAL': 4
        }
        
        # Major city coordinates for India
        self.city_centers = {
            'Ernakulam': (9.9312, 76.2673),
            'Thiruvananthapuram': (8.5241, 76.9366),
            'Kozhikode': (11.2588, 75.7804),
            'Bangalore': (12.9716, 77.5946),
            'Chennai': (13.0827, 80.2707),
            'Mumbai': (19.0760, 72.8777),
            'Delhi': (28.7041, 77.1025)
        }
    
    async def create_features(
        self,
        area_sqft: float,
        latitude: float,
        longitude: float,
        district: str,
        state: str,
        land_type: str,
        pincode: Optional[str] = None,
        road_width: Optional[float] = None,
        electricity: bool = True,
        water_supply: bool = True
    ) -> Dict:
        """Create feature vector for prediction"""
        
        features = {
            'area_sqft': area_sqft,
            'latitude': latitude,
            'longitude': longitude,
            'land_type_encoded': self.land_type_map.get(land_type, 1),
            'road_width': road_width or 6.0,  # Default 6m
            'electricity': 1 if electricity else 0,
            'water_supply': 1 if water_supply else 0,
            'state': state,
            'district': district
        }
        
        # Calculate distances
        if self.gmaps:
            try:
                distances = await self._calculate_distances(latitude, longitude, district)
                features.update(distances)
            except Exception as e:
                print(f"Google Maps API error: {e}")
                features.update(self._estimate_distances(latitude, longitude, district))
        else:
            features.update(self._estimate_distances(latitude, longitude, district))
        
        # Get average price in area (would come from database)
        features['avg_price_in_area'] = await self._get_avg_price_in_area(district, state)
        
        return features
    
    async def _calculate_distances(self, lat: float, lng: float, district: str) -> Dict:
        """Calculate actual distances using Google Maps"""
        origin = f"{lat},{lng}"
        
        # Get city center
        city_center = self.city_centers.get(district, (lat, lng))
        
        distances = {}
        
        try:
            # Distance to city center
            result = self.gmaps.distance_matrix(
                origins=origin,
                destinations=f"{city_center[0]},{city_center[1]}",
                mode="driving"
            )
            
            if result['rows'][0]['elements'][0]['status'] == 'OK':
                distance_m = result['rows'][0]['elements'][0]['distance']['value']
                distances['distance_to_city'] = distance_m / 1000  # Convert to km
            else:
                distances['distance_to_city'] = self._haversine_distance(
                    lat, lng, city_center[0], city_center[1]
                )
            
            # Find nearby places
            nearby_places = self.gmaps.places_nearby(
                location=(lat, lng),
                radius=5000,  # 5km radius
                type='school'
            )
            
            if nearby_places['results']:
                school_loc = nearby_places['results'][0]['geometry']['location']
                distances['distance_to_school'] = self._haversine_distance(
                    lat, lng, school_loc['lat'], school_loc['lng']
                )
            else:
                distances['distance_to_school'] = 5.0
            
            # Similar for hospital
            nearby_hospitals = self.gmaps.places_nearby(
                location=(lat, lng),
                radius=5000,
                type='hospital'
            )
            
            if nearby_hospitals['results']:
                hospital_loc = nearby_hospitals['results'][0]['geometry']['location']
                distances['distance_to_hospital'] = self._haversine_distance(
                    lat, lng, hospital_loc['lat'], hospital_loc['lng']
                )
            else:
                distances['distance_to_hospital'] = 3.0
            
        except Exception as e:
            print(f"Error calculating distances: {e}")
            return self._estimate_distances(lat, lng, district)
        
        # Default values for other distances
        distances['distance_to_highway'] = 5.0
        distances['distance_to_metro'] = 10.0
        
        return distances
    
    def _estimate_distances(self, lat: float, lng: float, district: str) -> Dict:
        """Estimate distances when Google Maps not available"""
        city_center = self.city_centers.get(district, (lat, lng))
        
        distance_to_city = self._haversine_distance(
            lat, lng, city_center[0], city_center[1]
        )
        
        return {
            'distance_to_city': distance_to_city,
            'distance_to_highway': 5.0,
            'distance_to_metro': 10.0,
            'distance_to_school': 2.0,
            'distance_to_hospital': 3.0
        }
    
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371  # Earth's radius in km
        
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c
    
    async def _get_avg_price_in_area(self, district: str, state: str) -> float:
        """Get average price in the area from database or estimates"""
        # This would query your database of scraped prices
        # For now, return estimates
        avg_prices = {
            'Kerala': {
                'Ernakulam': 2800,
                'Thiruvananthapuram': 2500,
                'Kozhikode': 2200
            },
            'Karnataka': {
                'Bangalore': 4200
            },
            'Tamil Nadu': {
                'Chennai': 3800
            }
        }
        
        return avg_prices.get(state, {}).get(district, 2000)
