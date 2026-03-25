"""
Quick Manual Test for ML System
Run this to test a few images quickly
"""

import requests
from pathlib import Path

SERVICE_URL = "http://localhost:5000"
DATASET = r"D:\amey\database\EuroSAT_RGB"

# Test one image from Forest class
test_images = [
    (r"D:\amey\database\EuroSAT_RGB\Forest", "Forest"),
    (r"D:\amey\database\EuroSAT_RGB\River", "River"),
    (r"D:\amey\database\EuroSAT_RGB\Highway", "Highway"),
]

print("Testing Python ML Service...\n")

# Health check
try:
    r = requests.get(f"{SERVICE_URL}/health", timeout=5)
    print(f"✅ Service Status: {r.json()['status']}")
except:
    print("❌ Service not reachable!")
    exit(1)

# Test each image
for dir_path, expected_class in test_images:
    images = list(Path(dir_path).glob("*.jpg"))
    if not images:
        continue
    
    test_file = images[0]
    print(f"\n{'='*50}")
    print(f"Testing: {expected_class} - {test_file.name}")
    print(f"{'='*50}")
    
    # Classify
    with open(test_file, 'rb') as f:
        files = {'image': f}
        r = requests.post(f"{SERVICE_URL}/classify", files=files)
    
    if r.status_code == 200:
        data = r.json()
        predicted = data.get('primary_class', 'Unknown')
        confidence = data.get('confidence', 0)
        
        match = "✅" if predicted == expected_class else "❌"
        print(f"{match} Predicted: {predicted} ({confidence:.1f}%)")
        print(f"   Expected: {expected_class}")
    else:
        print(f"❌ Error: {r.status_code}")

print("\n" + "="*50)
print("Manual test complete!")
