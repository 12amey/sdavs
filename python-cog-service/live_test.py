"""
Live Test - Running Now!
"""
import requests
from pathlib import Path
import json

SERVICE = "http://localhost:5000"

print("="*60)
print("LIVE ML SYSTEM TEST")
print("="*60)

# Test images
tests = [
    (r"D:\amey\database\EuroSAT_RGB\Forest\Forest_1.jpg", "Forest"),
    (r"D:\amey\database\EuroSAT_RGB\River\River_1.jpg", "River"),
    (r"D:\amey\database\EuroSAT_RGB\Highway\Highway_1.jpg", "Highway"),
]

results = []

for img_path, expected in tests:
    if not Path(img_path).exists():
        # Find first available image
        class_dir = Path(img_path).parent
        images = list(class_dir.glob("*.jpg"))
        if images:
            img_path = str(images[0])
        else:
            continue
    
    print(f"\n{'='*60}")
    print(f"Testing: {expected}")
    print(f"File: {Path(img_path).name}")
    print("="*60)
    
    try:
        # Classify
        with open(img_path, 'rb') as f:
            r = requests.post(f"{SERVICE}/classify", files={'image': f}, timeout=15)
        
        if r.status_code == 200:
            data = r.json()
            predicted = data.get('primary_class', 'Unknown')
            confidence = data.get('confidence', 0)
            
            is_correct = predicted == expected
            symbol = "✅" if is_correct else "❌"
            
            print(f"{symbol} Predicted: {predicted}")
            print(f"   Confidence: {confidence:.1f}%")
            print(f"   Expected: {expected}")
            print(f"   Method: {data.get('method', 'Unknown')}")
            
            # Top 3
            print("\n   Top 3 Predictions:")
            for i, p in enumerate(data.get('all_predictions', [])[:3], 1):
                print(f"   {i}. {p['class']}: {p['confidence']:.1f}%")
            
            results.append({
                'class': expected,
                'predicted': predicted,
                'correct': is_correct,
                'confidence': confidence
            })
        else:
            print(f"❌ HTTP {r.status_code}: {r.text[:200]}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

# Summary
print("\n" + "="*60)
print("TEST RESULTS SUMMARY")
print("="*60)

if results:
    correct = sum(1 for r in results if r['correct'])
    total = len(results)
    accuracy = (correct / total * 100) if total > 0 else 0
    
    print(f"\nAccuracy: {correct}/{total} ({accuracy:.1f}%)")
    print(f"Average Confidence: {sum(r['confidence'] for r in results)/total:.1f}%")
    
    print("\nResults:")
    for r in results:
        symbol = "✅" if r['correct'] else "❌"
        print(f"{symbol} {r['class']}: {r['predicted']} ({r['confidence']:.1f}%)")
else:
    print("No results to display")

print("\n" + "="*60)
print("✅ TESTING COMPLETE!")
print("="*60)
