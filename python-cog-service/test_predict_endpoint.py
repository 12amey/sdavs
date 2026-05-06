"""
Test Predictive ML Feature
"""
import requests
import json

def test_predict_endpoint():
    print("Testing /predict endpoint...")
    url = "http://localhost:5000/predict"
    payload = {
        "history": [20, 22, 21, 25, 28, 30, 32, 31, 29, 27, 25, 23],
        "forecast_count": 6
    }
    
    try:
        response = requests.post(url, json=payload)
        data = response.json()
        
        print(f"Response: {data}")
        if data.get("success"):
            print("✅ Predict endpoint test passed!")
            print(f"Predictions: {data['predictions']}")
            print(f"Trend Type: {data['trend_type']}")
        else:
            print(f"❌ Predict endpoint test failed: {data.get('error')}")
            
    except Exception as e:
        print(f"❌ Error connecting to service: {e}")

if __name__ == "__main__":
    test_predict_endpoint()
