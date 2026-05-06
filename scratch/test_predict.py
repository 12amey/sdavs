import requests
import json

data = {
    "history": [97.2, 108, 120],
    "forecast_count": 13
}

try:
    response = requests.post("http://localhost:5000/predict", json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
