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