from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import joblib
import os
import glob
import numpy as np
import json

app = FastAPI(title="Model Server")

# Configure CORS to allow requests from Expo web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "localhost:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_ROOT = os.path.join(os.path.dirname(__file__), "..", "models")


class CandidateMandi(BaseModel):
    name: str
    stateName: Optional[str] = None

class PredictRequest(BaseModel):
    crop: str
    mandi: Optional[str] = None
    horizon: str = "1D"
    candidateMandis: Optional[List[CandidateMandi]] = None
    recentPrices: Optional[List[float]] = None

class PredictionPoint(BaseModel):
    dayLabel: str
    price: float

class NearbyMandiPoint(BaseModel):
    name: str
    distanceKm: int
    targetPrice: float
    extraPerQtl: float
    netProfit: float
    worthIt: bool
    reason: Optional[str] = None

class PredictResponse(BaseModel):
    predictions: List[PredictionPoint]
    baseMandi: str
    nearbyMandis: List[NearbyMandiPoint]
    model: str
    confidence: str
    summary: str


class ModelCatalogResponse(BaseModel):
    supportedCropFolders: List[str]
    supportedCrops: List[str]
    supportedMandisByCrop: Dict[str, List[str]]


def normalize_key(value: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")


def list_supported_models() -> ModelCatalogResponse:
    if not os.path.isdir(MODELS_ROOT):
        return ModelCatalogResponse(supportedCropFolders=[], supportedCrops=[], supportedMandisByCrop={})

    supported_crop_folders: List[str] = []
    supported_crops: List[str] = []
    supported_mandis_by_crop: Dict[str, List[str]] = {}

    for entry in sorted(os.listdir(MODELS_ROOT)):
        crop_dir = os.path.join(MODELS_ROOT, entry)
        if not os.path.isdir(crop_dir):
            continue

        pkl_files = glob.glob(os.path.join(crop_dir, "**", "*.pkl"), recursive=True)
        if not pkl_files:
            continue

        supported_crop_folders.append(entry)
        supported_crops.append(entry)

        mandi_names: List[str] = []
        seen = set()
        for path in pkl_files:
            mandi_name = os.path.splitext(os.path.basename(path))[0]
            key = normalize_key(mandi_name)
            if key in seen:
                continue
            seen.add(key)
            mandi_names.append(mandi_name)

        supported_mandis_by_crop[entry] = mandi_names

    return ModelCatalogResponse(
        supportedCropFolders=supported_crop_folders,
        supportedCrops=supported_crops,
        supportedMandisByCrop=supported_mandis_by_crop,
    )


def find_model_for(mandi: Optional[str], crop: str):
    # Search models directory for a .pkl file matching the mandi or crop
    if not os.path.isdir(MODELS_ROOT):
        return None

    mandi_norm = (mandi or "").lower().replace(" ", "_")
    crop_norm = crop.lower().replace(" ", "_")

    # Prefer exact mandi match
    candidates = glob.glob(os.path.join(MODELS_ROOT, "**", "*.pkl"), recursive=True)
    for path in candidates:
        name = os.path.basename(path).lower()
        if mandi_norm and mandi_norm in name:
            return path

    # Fallback: find any model in a folder matching crop
    for path in candidates:
        if crop_norm in path.lower():
            return path

    # final fallback: return first model if available
    return candidates[0] if candidates else None


@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    model_path = find_model_for(req.mandi, req.crop)
    if not model_path:
        raise HTTPException(status_code=404, detail="No model file found for crop/mandi")

    try:
        model = joblib.load(model_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {e}")

    # Determine input features
    features = None
    if req.recentPrices and isinstance(req.recentPrices, list) and len(req.recentPrices) > 0:
        features = np.array(req.recentPrices, dtype=float)
    else:
        # try to find a cleaned dataset csv for the crop and use the last values
        csv_candidates = glob.glob(os.path.join(MODELS_ROOT, "**", "*cleaned*dataset*.csv"), recursive=True)
        if csv_candidates:
            try:
                import pandas as pd
                df = pd.read_csv(csv_candidates[0])
                price_cols = [c for c in df.columns if 'price' in c.lower() or 'close' in c.lower()]
                if price_cols:
                    last_prices = df[price_cols[0]].dropna().values[-7:]
                    if len(last_prices) > 0:
                        features = np.array(last_prices, dtype=float)
            except Exception:
                features = None

    if features is None:
        # As a safe fallback, use a simple baseline series
        features = np.full((7,), np.median([1000.0]))

    # Prepare input respecting model's expected feature shape if available
    try:
        import traceback

        expected_n = getattr(model, "n_features_in_", None)
        feature_names = getattr(model, "feature_names_in_", None)

        if expected_n is not None:
            # Adjust features length to expected count
            vals = np.asarray(features).ravel()
            if vals.size < expected_n:
                pad = np.full((expected_n - vals.size,), vals[-1] if vals.size > 0 else 0.0)
                vals = np.concatenate([vals, pad])
            elif vals.size > expected_n:
                vals = vals[-expected_n:]

            inp = vals.reshape(1, -1)

            # If model was trained with feature names, try to supply a DataFrame
            try:
                if feature_names is not None:
                    import pandas as pd
                    df = pd.DataFrame([inp.ravel()], columns=list(feature_names))
                    raw = model.predict(df)
                else:
                    raw = model.predict(inp)
            except Exception:
                # Last resort: try raw numpy input
                raw = model.predict(inp)
        else:
            # Unknown expected shape; try common shapes
            try:
                inp = features.reshape(1, -1)
                raw = model.predict(inp)
            except Exception:
                raw = model.predict(features)

    except Exception as e:
        # Log traceback for local debugging
        import traceback
        tb = traceback.format_exc()
        print("Model prediction error:\n", tb)
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {str(e)}")

    # Normalize raw prediction to array of up to 7 day prices
    preds = []
    if isinstance(raw, (list, tuple, np.ndarray)):
        arr = np.array(raw).ravel()
        # If model returns a single value, expand it
        if arr.size == 1:
            base = float(arr[0])
            preds = [max(1, round(base + (i - 0) * 10)) for i in range(7)]
        else:
            # use up to 7
            vals = arr.tolist()
            while len(vals) < 7:
                vals.append(vals[-1])
            preds = [max(1, round(float(v))) for v in vals[:7]]
    else:
        try:
            base = float(raw)
            preds = [max(1, round(base + i * 10)) for i in range(7)]
        except Exception:
            raise HTTPException(status_code=500, detail="Unexpected model output format")

    predictions = [{"dayLabel": ("Tomorrow" if i == 0 else f"Day {i+1}"), "price": int(preds[i])} for i in range(7)]

    base_mandi = req.mandi or "Your selected mandi"

    # Build simplistic nearby mandis output
    nearby = []
    candidate_names = [c.name for c in (req.candidateMandis or []) if c.name]
    fallback_names = candidate_names[:3] if candidate_names else [f"Nearby APMC {i+1}" for i in range(3)]
    for idx, name in enumerate(fallback_names[:3]):
        distanceKm = 20 + idx * 15
        targetPrice = max(1, int(predictions[0]['price'] * (1 + (0.05 * (idx - 1)))))
        extraPerQtl = targetPrice - predictions[0]['price']
        netProfit = extraPerQtl * 10 - distanceKm * 5 * 10
        nearby.append({
            "name": name if name != base_mandi else f"{name} (alt)",
            "distanceKm": distanceKm,
            "targetPrice": targetPrice,
            "extraPerQtl": extraPerQtl,
            "netProfit": netProfit,
            "worthIt": netProfit > 0,
            "reason": "Calculated from model baseline",
        })

    return PredictResponse(
        predictions=[PredictionPoint(**p) for p in predictions[: (1 if req.horizon == '1D' else 7)]],
        baseMandi=base_mandi,
        nearbyMandis=[NearbyMandiPoint(**n) for n in nearby],
        model=os.path.basename(model_path),
        confidence="medium",
        summary="Predictions generated from local .pkl model",
    )


@app.get("/catalog", response_model=ModelCatalogResponse)
async def catalog():
    return list_supported_models()
