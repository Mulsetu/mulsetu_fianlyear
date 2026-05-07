# Mulsetu - React Native Expo App

A React Native Expo application for transparent price discovery for farmers and traders.

## Features

- **Authentication Screens**
  - Sign In page with email/password and Google authentication UI
  - Sign Up page with form validation
  - Clean, modern UI with Mulsetu branding

- **Design System**
  - Primary color: #60941a (green)
  - Secondary color: #19696c (teal)
  - Background: #ffffff (white)
  - Inter font family for clean, modern typography

- **Navigation**
  - Expo Router for seamless navigation
  - Automatic redirect to sign-in screen
  - Home screen with welcome message and feature preview

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- Expo Go app (for mobile testing)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open the app:
   - **Web**: Press `w` in the terminal or visit the web URL
   - **Mobile**: Scan the QR code with Expo Go app

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run web` - Start the web version
- `npm run android` - Start on Android device/emulator
- `npm run ios` - Start on iOS device/simulator
- `npm run lint` - Run ESLint

## Project Structure

```
app/
├── _layout.tsx          # Root layout with navigation setup
├── index.tsx            # Entry point (redirects to sign-in)
├── sign-in.tsx          # Sign in screen
├── sign-up.tsx          # Sign up screen
├── home.tsx             # Home screen
└── (tabs)/              # Tab navigation (existing)

styles/
└── authStyles.ts        # Authentication screen styles

constants/
└── theme.ts             # Color palette and font configuration
```

## Next Steps

This is the frontend-only version. The next phase will include:

1. **Supabase Integration**
   - User authentication
   - Database setup
   - Real-time data synchronization

2. **Additional Features**
   - Market price display
   - Trading interface
   - User profiles
   - Analytics dashboard

## Design Guidelines

- **Colors**: Use the defined color palette in `constants/theme.ts`
- **Typography**: Use Inter font family with appropriate weights
- **Components**: Follow the established styling patterns in `styles/authStyles.ts`
- **Responsive**: Ensure layouts work across different screen sizes

## Development Notes

- The app uses Expo Router for navigation
- Google Fonts (Inter) are loaded via expo-google-fonts
- Form validation is implemented on the frontend
- Loading states are included for better UX
- The app is ready for Supabase integration

## AI Prediction Setup (Gemini)

The AI prediction tab now calls a Supabase Edge Function (`ai-price-prediction`) which securely uses your Gemini API key server-side.

1. Add required secrets in Supabase:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_gemini_key
   supabase secrets set GEMINI_MODEL=gemini-2.0-flash
   ```

2. Deploy the edge function:
   ```bash
   supabase functions deploy ai-price-prediction
   ```

3. Ensure app env vars are present (client-safe values only):
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Important:
- Never store `GEMINI_API_KEY` in Expo public env vars.
- Keep API keys only in Supabase secrets or another secure backend secret store.

Local model server (optional)

If you prefer to host the trained `.pkl` models locally and have the Supabase function call your local model server, follow these steps:

1. Start the model server (Windows PowerShell):

```powershell
cd model_server
.\setup.ps1
.\run_server.ps1
```

2. Configure the Supabase function for local testing:

- Copy `supabase/functions/.env.example` to your local env or set the `MODEL_SERVER_URL` env var to `http://localhost:8000`.
- Deploy (or run) the Supabase function that will call the model server; when `MODEL_SERVER_URL` is set, the function sends prediction requests to your local server.
- The AI prediction dropdowns now come from the local model catalog only, so the crop and mandi lists stay aligned with your `models/` folder.

3. Run a quick test (in another PowerShell window):

```powershell
cd model_server
.\run_test.ps1
```

Notes:
- The model server looks for `.pkl` files inside the repository `models/` directory. Ensure your trained models are present under `models/`.
- For best results, pass `recentPrices` from the client to aid the model server's prediction input.