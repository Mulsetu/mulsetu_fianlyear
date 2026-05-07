import requests
import json

URL = "http://localhost:8000/predict"

payload = {
    "crop": "Water Melon",
    "mandi": "Azadpur_APMC",
    "horizon": "7D",
    "candidateMandis": [
        {"name": "Azadpur_APMC"},
        {"name": "Bikaner_F_V_APMC"},
        {"name": "Barnala_APMC"}
    ],
    # Optional: provide recentPrices to improve model input
    "recentPrices": [3200, 3150, 3180, 3220, 3190, 3210, 3230]
}

resp = requests.post(URL, json=payload, timeout=10)
print(f"Status: {resp.status_code}")
try:
    print(json.dumps(resp.json(), indent=2))
except Exception:
    print(resp.text)
