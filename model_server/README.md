Model server

This is a small FastAPI template to host your trained .pkl models and expose a /predict endpoint compatible with the app's Supabase function.

Quick start (local):

1. Create a virtual env & install deps

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2. Run the server

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

3. Point the Supabase function to the server by setting the `MODEL_SERVER_URL` environment variable (for local testing `http://localhost:8000`).

Notes:
- The server will attempt to locate a .pkl model file inside the repository `models/` folder matching the requested `mandi` or `crop`.
- For accurate predictions, include `recentPrices` in the request body (array of floats representing recent price features) when calling `/predict`.
- The server is a template and may need adjustments depending on how your models expect inputs (feature engineering, date encodings, scalers, etc.).

Windows quick helpers
 - Use the provided PowerShell helpers from `model_server/`:
	 - `setup.ps1` — creates a virtual environment and installs dependencies.
	 - `run_server.ps1` — activates the venv and runs `uvicorn` on port `8000` (or `MODEL_SERVER_PORT` if set).
	 - `run_test.ps1` — performs a simple POST to `/predict` and saves the response to `last_test_response.json`.

Example (PowerShell):

```powershell
cd model_server
.\setup.ps1
.\run_server.ps1
# In a new terminal, after server is up:
.\run_test.ps1
```

Environment variables
 - Copy `supabase/functions/.env.example` to your local environment and ensure `MODEL_SERVER_URL` is set to `http://localhost:8000` before invoking the Supabase function.
