# MULSETU PROJECT DOCUMENTATION (IN-DEPTH)

## 1. Executive Summary

Mulsetu is a role-based digital agri-market platform built with Expo and React Native for mobile and web. It combines marketplace workflows (buy/sell), market intelligence (discover + price reports), user profile management, and AI-assisted price forecasting.

The project is designed around practical field usage for:
- Farmers
- Traders
- Logistics partners
- Admin operators

A key technical strength of this project is its hybrid prediction architecture:
- Cloud AI flow through Supabase Edge Function
- Optional local FastAPI model server that serves trained `.pkl` models from the repository

## 2. Project Goals and Scope

### 2.1 Primary Goals
- Improve transparency of mandi prices for fruit commodities
- Help users take faster buy/sell decisions
- Support role-specific dashboards and actions
- Integrate AI-based short-term forecasting with fallback safety
- Keep architecture modular for future scaling

### 2.2 Current Scope Covered in Codebase
- Authentication and user profile lifecycle via Supabase
- Role-aware navigation and access control
- Discover section with commodity browsing and search
- Price report screen with dynamic state/market filtering
- Sell listing workflow with images, video, and geo-capture
- Buy listing workflow with offer placement and tracking
- AI prediction flow with model catalog and history
- Basic logistics and admin dashboards
- PWA-ready web deployment path

## 3. Technology Stack

### 3.1 Frontend
- Expo SDK 54
- React Native 0.81
- React 19
- Expo Router for file-based routing
- TypeScript (strict mode)
- NativeWind/Tailwind config present
- Reanimated + Lucide + Ionicons for UI interactions and iconography

### 3.2 Data and Backend Services
- Supabase Auth for authentication
- Supabase Database (PostgreSQL) for app data
- Supabase Storage for media uploads
- Supabase Edge Function for AI prediction orchestration

### 3.3 AI and Model Serving
- Local Python model server using FastAPI
- joblib + scikit-learn + numpy + pandas
- Trained model artifacts in `.pkl` format under models/

### 3.4 Build and Deployment
- Expo CLI for local dev and multi-platform serving
- Static web export support
- Vercel configuration for SPA-style web deployment
- Service worker + manifest for PWA behavior

## 4. System Architecture

### 4.1 Layered Architecture
- Presentation Layer: app/ screens and UI components
- Context and Session Layer: contexts/UserContext.tsx + AsyncStorage
- Data Access Layer: Supabase client + reusable API utility
- AI Orchestration Layer: edge function + local model server
- Model Artifact Layer: `models/` tree of mandi-specific `.pkl` files

### 4.2 Authentication and Session Flow
1. App starts and checks Supabase session.
2. If authenticated, profile is fetched from `user_profiles`.
3. Profile is mapped into app-level `User` shape and cached.
4. If signed out or invalid session, user is redirected to sign-in.

### 4.3 AI Prediction Runtime Flow
1. User selects crop, mandi, and horizon (`1D` or `7D`).
2. App attempts local model server prediction if local model URL is configured.
3. If unavailable, app invokes Supabase function `ai-price-prediction`.
4. Edge function tries external/local model URL first.
5. If not available, it uses Gemini (if key configured).
6. If Gemini unavailable, deterministic fallback prediction is returned.
7. UI renders forecast, nearby mandi comparison, and summary.

## 5. Feature Inventory (Complete)

## 5.1 Core Platform Features
- Multi-role application model (Farmer, Trader, Logistics, Admin)
- Role-guarded tab visibility and route control
- Supabase-authenticated session management
- Responsive layout utilities for desktop and mobile
- Theme constants and reusable UI primitives

### 5.2 Authentication Features
- Email/password sign-up with validations:
  - name, email, phone, password, confirm password, role, market, terms acceptance
- Email/password sign-in
- Supabase profile fetch and role mapping
- Sign-out with platform-safe confirmation dialogs
- PWA install assistance from sign-up page on web

### 5.3 Role-Based Navigation Features
- Farmer view: Home, Discover, AI Prediction, Sell, Profile
- Trader view: Home, Discover, AI Prediction, Buy, Profile
- Logistics view: Logistics
- Admin view: Admin
- Hidden but routable utility screens (for internal navigation flows)

### 5.4 Home Dashboard Features
- Personalized greeting and profile initials
- Location display resolution from profile fields
- Market highlight cards with commodity snapshots
- Trend tip cards for quick market insight
- Government scheme list and external links
- Trader-specific ongoing bids panel
- Offer leaderboard modal for listing competition visibility
- Auto-scrolling ticker/slider style UX segments

### 5.5 Discover Features
- Commodity fetch from `discover_fruits` view
- Fallback fetch from `fruit_commodities` table if view unavailable
- Search bar filter on commodity name
- Commodity cards with image, trend icon, current price (if present)
- Navigation to crop-specific price report page
- Pull-to-refresh and retry error handling

### 5.6 Price Report Features
- Dynamic crop route: `price-report/[crop]`
- Commodity ID resolution from `fruit_commodities`
- State list generation from `all_prices` (fallback to `daily_prices`)
- Market list generation by selected state
- Price history line chart rendering with local SVG
- Current price, min/max, and comparative bars
- Nearby mandi derived comparison and sorting
- Flexible data window for trend continuity

### 5.7 Sell Features
- Seller listing creation modal and validation
- Produce selection sourced from discover/commodity data
- Listing fields:
  - produce, quality, quantity, min offer size, price per quintal, seller type, market
- Mandatory 3-photo upload flow:
  - crop photo, quality photo, packaging photo
- Optional video URI handling
- Location capture via Expo Location + reverse geocoding
- Supabase Storage upload helper with size checks
- Listing insertion into `listings` table
- Seller listing management and offer modal interactions

### 5.8 Buy Features
- Listing retrieval from `listings_for_buy` with fallback query shape handling
- Search and filter interactions
- Offer modal with quantity/price entry
- Existing offers tracking (`My Offers`)
- Listing detail modal with photos, media links, and offer leaderboard
- One-offer-per-listing interaction patterns via existing offer checks
- Recommendation/forecast modal states integrated in screen logic

### 5.9 AI Prediction Features
- Supported crop and mandi catalog fetch from model server
- Crop normalization helpers for robust matching
- Prediction horizon support (`1D`, `7D`)
- Recent price feature fetch from Supabase
- Nearby mandi profitability analysis display
- Prediction history loader and replay support
- Queue status handling (`pending/completed/failed`)
- Local fallback prediction generation if remote fails

### 5.10 Profile Features
- Profile overview card and verification badge
- Edit profile modal with market selector
- Market source from paginated `state_market_import`
- Avatar upload via image picker + Supabase Storage
- User activity cards and account detail rendering
- Safe redirect to sign-in when session is absent

### 5.11 Admin Features
- Admin dashboard shell with overview/users/settings tabs
- System stat cards and quick action cards
- User action stubs (block/unblock/delete) in UI
- Integrated `AdminAiManualQueue` component

### 5.12 Admin Manual AI Queue Features
- Polling `ai_prediction_manual_requests` queue
- Manual JSON paste and validation
- Mark completed with stored response JSON
- Mark failed with admin note
- Queue refresh and status rendering

### 5.13 Logistics Features
- Logistics dashboard shell with requests/documents/profile tabs
- Request lifecycle action controls (accept/reject/start/complete)
- Document status views and upload action placeholders
- Current implementation uses mock datasets (UI flow ready, backend wiring pending)

### 5.14 History Features
- Commodity history visualizations (line trend + summary cards)
- Period selector and commodity selector UX
- Current implementation uses mock datasets (UI flow ready)

### 5.15 PWA/Web Features
- Service worker registration for production web host
- Install prompt event capture and deferred handling
- Web manifest and static output support

## 6. Database and Table/View Usage

The code currently references these entities:
- `user_profiles`
- `fruit_commodities`
- `discover_fruits` (view)
- `state_market_import`
- `listings`
- `listings_for_buy` (view/table abstraction)
- `listing_offers`
- `daily_prices`
- `daily_prices_history` (through union view usage assumptions)
- `all_prices` (view for current + historical aggregation)
- `ai_prediction_manual_requests`

## 7. API and Utility Design

### 7.1 Supabase Client Utility
- Centralized client creation with env-based URL/key
- Startup warning for missing public env values

### 7.2 Generic API Client Utility
- Endpoint registry across auth, user, listings, transport, admin
- HTTP methods: GET/POST/PUT/PATCH/DELETE
- Upload helper and standardized response handling
- Useful for future non-Supabase backend expansion

### 7.3 State-Market Import Utility
- Handles Supabase row limits using pagination (`1000` rows/page)
- Retry with exponential backoff for transient failures

### 7.4 Media Upload Utility
- Converts local URIs to Blob
- Enforces max upload size (5 MB)
- Uploads three listing photos to storage bucket
- Returns public URLs for listing persistence

## 8. AI AND MODEL SUBSYSTEM (FULL DETAIL)

### 8.1 Why Two Inference Paths Exist
The project supports both cloud and local inference to maximize reliability:
- Cloud path provides central orchestration and LLM-backed generation.
- Local path serves trained `.pkl` models directly, useful for offline-like dev setups and custom model control.

### 8.2 Client AI Helper Capabilities
- Calls local model server when configured
- Falls back to Supabase edge function automatically
- Normalizes response payloads into UI-safe structures
- Validates prices and candidate mandi data
- Fetches recent prices from Supabase as model input features

### 8.3 Supabase Edge Function Capabilities
- CORS-enabled POST endpoint
- Accepts crop, mandi, horizon, and candidate mandis
- Supports model server passthrough (`MODEL_SERVER_URL`)
- Supports Gemini generation (`GEMINI_API_KEY` + model name)
- Provides deterministic fallback outputs if external AI unavailable
- Enforces structured output with predictions + nearby market profitability

### 8.4 Local FastAPI Model Server Capabilities
- Endpoint: `POST /predict`
- Endpoint: `GET /catalog`
- Scans `models/` recursively for `.pkl`
- Attempts mandi name matching first, then crop folder fallback
- Adapts feature vector length to model expected shape (`n_features_in_`)
- Uses `recentPrices` when provided by client
- Builds normalized 1D/7D response for app compatibility

### 8.5 .PKL Model Inventory (Exact)
Total trained `.pkl` files in repository: **1923**

#### 8.5.1 Top-Level Model Folder Counts
- `final_models_Amla(Nelli Kai)`: 60
- `final_models_Apple`: 404
- `final_models_Grapes`: 131
- `final_models_Guava`: 154
- `final_models_orange`: 115
- `final_models_Papaya`: 291
- `final_models_Pear(Marasebu)`: 7
- `final_models_Pineapple`: 96
- `final_models_Pomegranate`: 265
- `final_models_Tender`: 60
- `Water Melon`: 340

#### 8.5.2 Water Melon Model Family Breakdown
The `Water Melon` folder contains four model families, each with identical mandi coverage:
- `final_models_Water Melon`: 85
- `lgb_models_Water Melon`: 85
- `rf_models_Water Melon`: 85
- `xgb_models_Water Melon`: 85

This indicates a comparative multi-algorithm setup for Water Melon forecasting.

### 8.6 .PKL Naming Convention and Meaning
Model filenames are mandi-centric (examples: `Nasik_APMC.pkl`, `Pune_Moshi_APMC.pkl`).
This provides:
- Direct market-level model lookup
- Easy mapping to mandi dropdown values
- Human-readable model auditing

### 8.7 Additional Model Artifacts in Repository
Besides `.pkl`, the model folders include:
- Accuracy CSVs
- Model comparison CSVs
- Cleaned datasets
- Notebook artifacts (`.ipynb`)

These support reproducibility, experimentation, and model governance.

## 9. Data Contracts and Type System

Shared domain interfaces in `types/index.ts` define:
- User and role models
- Produce and price entities
- Market entities
- Listing and offer contracts
- Transport entities
- Notification and analytics contracts
- Generic API response contracts

Benefit:
- Consistent shape expectations across screens
- Lower integration risk between UI and backend
- Easier future test automation and refactor

## 10. Testing Status and Quality Notes

### 10.1 What Is Fully Implemented
- Functional manual flows for auth, profile, buy/sell, discover, AI prediction
- Supabase-backed integration for production-like data interactions
- Graceful fallback paths for prediction failures

### 10.2 What Is Partially Implemented / Mocked
- Logistics dashboard currently uses mock request/document data
- History screen currently uses mock chart data
- Admin overview/users stats are UI-mocked; manual AI queue is live

### 10.3 Current Testing Approach
- Manual functional testing
- Integration-style verification with Supabase
- Runtime validation through alert/error paths
- No automated Jest/Detox suite configured in scripts currently

## 11. Environment Variables and Secrets

### 11.1 Client (Expo Public)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL` (optional generic API base)
- `EXPO_PUBLIC_MODEL_SERVER_URL` (optional local model endpoint)

### 
- `

Security rule:
- Never store private model/API keys in Expo public env variables.

## 12. Build, Run, and Deployment Operations

### 12.1 App Development
- Install dependencies: `npm install`
- Start dev server: `npm start`
- Start web: `npm run web`
- Lint: `npm run lint`

### 12.2 Local Model Server
- `cd model_server`
- `.\setup.ps1`
- `.\run_server.ps1`
- `.\run_test.ps1`

### 12.3 Web Export and Hosting
- Build static web output: `npm run build:web`
- Vercel uses `dist` and SPA rewrite to `index.html`

## 13. Strengths, Gaps, and Next Engineering Priorities

### 13.1 Strengths
- Strong role-based architecture and navigation control
- Rich buy/sell feature implementation with media and location
- Robust AI pipeline with multi-level fallback
- Large trained model inventory with mandi-level granularity
- PWA-ready web support

##

## 14. Final Conclusion

Mulsetu is already a feature-rich agri-market application with real multi-role workflows, AI-assisted forecasting, and a substantial mandi-level model base (1923 `.pkl` files). The current architecture is production-oriented for core flows and is well-positioned for the next phase: stronger automation, analytics telemetry, and full conversion of remaining mock modules to live data.
