import requests
import json

# ML Service URL
ML_SERVICE_URL = "http://localhost:8001/predict"

# Test cases - 10 different property scenarios
test_properties = [
    {
        "name": "Test 1: 2 BHK Flat in Chennai",
        "data": {
            "area_sqft": 1000,
            "latitude": 13.0827,
            "longitude": 80.2707,
            "district": "Chennai",
            "state": "Tamil Nadu",
            "land_type": "RESIDENTIAL",
            "pincode": "600001"
        }
    },
    {
        "name": "Test 2: 3 BHK Villa in Bangalore",
        "data": {
            "area_sqft": 2000,
            "latitude": 12.9716,
            "longitude": 77.5946,
            "district": "Bangalore",
            "state": "Karnataka",
            "land_type": "RESIDENTIAL",
            "pincode": "560001"
        }
    },
    {
        "name": "Test 3: 5 Cent Plot in Thrissur",
        "data": {
            "area_sqft": 2178,
            "latitude": 10.5276,
            "longitude": 76.2144,
            "district": "Thrissur",
            "state": "Kerala",
            "land_type": "RESIDENTIAL",
            "pincode": "680001"
        }
    },
    {
        "name": "Test 4: 1 BHK Apartment in Chennai",
        "data": {
            "area_sqft": 600,
            "latitude": 13.0827,
            "longitude": 80.2707,
            "district": "Chennai",
            "state": "Tamil Nadu",
            "land_type": "RESIDENTIAL",
            "pincode": "600001"
        }
    },
    {
        "name": "Test 5: 4 BHK Independent House in Chennai",
        "data": {
            "area_sqft": 3000,
            "latitude": 13.0827,
            "longitude": 80.2707,
            "district": "Chennai",
            "state": "Tamil Nadu",
            "land_type": "RESIDENTIAL",
            "pincode": "600001"
        }
    },
    {
        "name": "Test 6: 10 Cent Agricultural Land in Ernakulam",
        "data": {
            "area_sqft": 4356,
            "latitude": 9.9312,
            "longitude": 76.2673,
            "district": "Ernakulam",
            "state": "Kerala",
            "land_type": "AGRICULTURAL",
            "pincode": "682001"
        }
    },
    {
        "name": "Test 7: 2 BHK Flat in T Nagar, Chennai",
        "data": {
            "area_sqft": 1200,
            "latitude": 13.0418,
            "longitude": 80.2341,
            "district": "Chennai",
            "state": "Tamil Nadu",
            "land_type": "RESIDENTIAL",
            "pincode": "600017"
        }
    },
    {
        "name": "Test 8: Small Studio Apartment in Chennai",
        "data": {
            "area_sqft": 400,
            "latitude": 13.0827,
            "longitude": 80.2707,
            "district": "Chennai",
            "state": "Tamil Nadu",
            "land_type": "RESIDENTIAL",
            "pincode": "600001"
        }
    },
    {
        "name": "Test 9: Luxury 5 BHK Villa in Chennai",
        "data": {
            "area_sqft": 5000,
            "latitude": 13.0827,
            "longitude": 80.2707,
            "district": "Chennai",
            "state": "Tamil Nadu",
            "land_type": "RESIDENTIAL",
            "pincode": "600001"
        }
    },
    {
        "name": "Test 10: 1 Acre Commercial Land in Bangalore",
        "data": {
            "area_sqft": 43560,
            "latitude": 12.9716,
            "longitude": 77.5946,
            "district": "Bangalore",
            "state": "Karnataka",
            "land_type": "COMMERCIAL",
            "pincode": "560001"
        }
    }
]

def test_ml_predictions():
    """Test ML model with 10 different property scenarios"""
    print("=" * 80)
    print("🧪 ML MODEL PREDICTION TEST")
    print("=" * 80)
    print(f"\nTesting {len(test_properties)} different property scenarios...\n")
    
    results = []
    
    for i, test_case in enumerate(test_properties, 1):
        print(f"\n{'─' * 80}")
        print(f"Test {i}: {test_case['name']}")
        print(f"{'─' * 80}")
        
        try:
            # Make prediction request
            response = requests.post(ML_SERVICE_URL, json=test_case['data'], timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                
                # Display results
                print(f"✅ Status: SUCCESS")
                print(f"\n📍 Property Details:")
                print(f"   Area: {test_case['data']['area']} {test_case['data']['area_unit']}")
                print(f"   Location: {test_case['data']['location']}")
                print(f"   Type: {test_case['data']['land_type']}")
                
                print(f"\n💰 Prediction Results:")
                print(f"   Predicted Price: ₹{result['predicted_price']:,.0f}")
                print(f"   Price per Sqft: ₹{result['price_per_sqft']:,.0f}")
                print(f"   Confidence: {result['confidence_score'] * 100:.1f}%")
                print(f"   Price Range: ₹{result['confidence_interval']['min']:,.0f} - ₹{result['confidence_interval']['max']:,.0f}")
                
                if 'market_insights' in result:
                    print(f"\n📊 Market Insights:")
                    insights = result['market_insights']
                    print(f"   Market Activity: {insights.get('market_activity', 'N/A')}")
                    print(f"   Growth Rate: {insights.get('growth_rate', 'N/A')}%")
                
                results.append({
                    'test': test_case['name'],
                    'status': 'SUCCESS',
                    'price': result['predicted_price']
                })
            else:
                print(f"❌ Status: FAILED")
                print(f"   Error: HTTP {response.status_code}")
                print(f"   Response: {response.text}")
                
                results.append({
                    'test': test_case['name'],
                    'status': 'FAILED',
                    'error': f"HTTP {response.status_code}"
                })
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Status: CONNECTION ERROR")
            print(f"   Error: Could not connect to ML service at {ML_SERVICE_URL}")
            print(f"   Make sure the ML service is running: python app.py")
            
            results.append({
                'test': test_case['name'],
                'status': 'CONNECTION_ERROR'
            })
            
        except Exception as e:
            print(f"❌ Status: ERROR")
            print(f"   Error: {str(e)}")
            
            results.append({
                'test': test_case['name'],
                'status': 'ERROR',
                'error': str(e)
            })
    
    # Summary
    print(f"\n\n{'=' * 80}")
    print("📊 TEST SUMMARY")
    print(f"{'=' * 80}")
    
    successful = sum(1 for r in results if r['status'] == 'SUCCESS')
    failed = len(results) - successful
    
    print(f"\nTotal Tests: {len(results)}")
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {successful / len(results) * 100:.1f}%")
    
    if successful > 0:
        print(f"\n💰 Price Range:")
        prices = [r['price'] for r in results if r['status'] == 'SUCCESS']
        print(f"   Minimum: ₹{min(prices):,.0f}")
        print(f"   Maximum: ₹{max(prices):,.0f}")
        print(f"   Average: ₹{sum(prices) / len(prices):,.0f}")
    
    print(f"\n{'=' * 80}")
    
    # Save results to file
    with open('test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    print("\n💾 Results saved to: test_results.json")
    
    return results

if __name__ == "__main__":
    test_ml_predictions()
