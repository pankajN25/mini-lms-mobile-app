# MiniLMS — Mobile Learning Management System

A Mini LMS mobile app built with **Expo (React Native)** and **TypeScript** as an assignment submission for **House of EdTech**.

> **API Base:** https://api.freeapi.app

---

## Screenshots

| Login | Course Catalog | Course Detail | Profile |
|-------|---------------|---------------|---------|
| ![Login](./assets/screenshots/login.png) | ![Catalog](./assets/screenshots/catalog.png) | ![Detail](./assets/screenshots/detail.png) | ![Profile](./assets/screenshots/profile.png) |

---

## Features

### Part 1 — Authentication & User Management
- Email/password **Login** and **Register** via `freeapi.app` user endpoints
- **Google Sign-In** via Firebase Auth
- Auth tokens stored in **Expo SecureStore** — survives app restarts
- Auto-login on app launch if token is valid
- **Logout** clears tokens and resets state
- **Forgot Password** screen
- **Profile screen** — display name, email, avatar, stats (courses enrolled, bookmarks)
- **Edit Profile** — update username and profile picture (Expo Image Picker)
- **Change Password** screen

### Part 2 — Course Catalog
- Courses fetched from `/api/v1/public/randomproducts` merged with instructors from `/api/v1/public/randomusers`
- Scrollable course list with thumbnail, instructor, title, description, bookmark icon
- **Search** to filter courses by title or description
- **Pull-to-refresh**
- **Bookmark toggle** persisted in AsyncStorage
- **Course Detail** screen — full info, Enroll button, bookmark toggle

### Part 3 — WebView Integration
- Embedded WebView screen for course content
- Loads a local HTML template with course details injected from native
- Native-to-WebView communication via `postMessage`

### Part 4 — Native Features
- **Push Notifications** — milestone notification when 5+ courses are bookmarked
- **24-hour re-engagement notification** — scheduled on each session, reset on next app open
- Notification permission request handled gracefully

### Part 5 — State Management & Performance
- Global auth state via React Context
- Course list, bookmarks, enrollments, preferences persisted with **AsyncStorage**
- Sensitive data (auth tokens) in **Expo SecureStore**
- LegendList for optimized list rendering with memoized items

### Part 6 — Error Handling
- API failures show user-friendly error messages with retry
- Offline mode banner (network detection)
- WebView error handling with fallback UI

### Additional Features
- **Refer & Earn** screen — unique referral code per user, copy & share via native Share sheet
- **Onboarding** screen for first-time users
- **Settings** — notifications, appearance, help & support
- Bottom tab safe area fix for Android 3-button navigation
- Notification bell with unread badge in app header

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 56, React Native 0.85 |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router (file-based) |
| HTTP Client | Axios + interceptors + retry |
| Forms | React Hook Form + Zod |
| Sensitive Storage | Expo SecureStore |
| App Storage | AsyncStorage |
| Auth | Firebase Auth (Google Sign-In + email/password) |
| Database | Firebase Firestore (user profiles) |
| Notifications | Expo Notifications |
| Image Handling | Expo Image |
| Image Picker | Expo Image Picker |
| List Performance | LegendList |

---

## Project Structure

```
MiniLMS/
├── app/
│   ├── _layout.tsx              # Root layout — providers, navigation shell
│   ├── index.tsx                # Auth gate — redirects to tabs or login
│   ├── onboarding.tsx           # First-time user onboarding
│   ├── (auth)/
│   │   ├── login.tsx            # Email/password + Google login
│   │   ├── register.tsx         # Registration with terms checkbox
│   │   ├── forgot-password.tsx  # Password reset
│   │   └── terms.tsx            # Terms of Service & Privacy Policy
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab bar with safe area insets
│   │   ├── index.tsx            # Home — course catalog
│   │   ├── search.tsx           # Search screen
│   │   ├── bookmarks.tsx        # Saved courses
│   │   ├── notifications.tsx    # In-app notifications
│   │   └── profile.tsx          # User profile + settings menu
│   ├── course/
│   │   ├── [id].tsx             # Course detail
│   │   └── webview.tsx          # Embedded content viewer
│   └── settings/
│       ├── edit-profile.tsx
│       ├── change-password.tsx
│       ├── notifications.tsx
│       ├── appearance.tsx
│       ├── help.tsx
│       └── refer-earn.tsx
│
├── src/
│   ├── components/              # Reusable UI components
│   ├── context/
│   │   └── AuthContext.tsx      # Global auth state
│   ├── hooks/                   # useAuth, useBookmarks, useCourses, etc.
│   ├── services/
│   │   ├── api/                 # Axios client, auth, courses, users
│   │   ├── auth/                # Firebase Google Sign-In
│   │   └── notifications/       # Permission + scheduler
│   ├── store/                   # SecureStore + AsyncStorage helpers
│   ├── config/
│   │   └── firebase.ts          # Firebase app init
│   └── types/                   # TypeScript domain + API types
│
├── assets/                      # App icon, splash screen, images
├── .env.example                 # Environment variable template
├── app.json                     # Expo config
├── eas.json                     # EAS build profiles
└── tsconfig.json                # Strict mode, @/* path alias
```

---

## Setup Instructions

### Prerequisites

- Node.js >= 20
- npm >= 10
- Expo Go app **or** Android emulator
- Google Sign-In requires an EAS build (not available in Expo Go)

### 1. Clone the repository

```bash
git clone https://github.com/pankajN25/mini-lms-expo.git
cd mini-lms-expo
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your API keys.

### 4. Start the development server

```bash
npx expo start
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | API base URL (`https://api.freeapi.app`) |
| `EXPO_PUBLIC_APP_VERSION` | App version string |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Gemini API key |
| `EXPO_PUBLIC_YOUTUBE_API_KEY` | YouTube Data API key |

> Auth tokens are stored in **Expo SecureStore** at runtime — never in env files.

---

## Building the APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build preview APK
eas build --platform android --profile preview
```

Download the APK from the link shown in terminal or at expo.dev.

---

## Key Architectural Decisions

**1. Firebase Auth + freeapi.app side by side**
Email/password auth uses `freeapi.app` endpoints. Google Sign-In uses Firebase Auth. On Google login, the user profile is saved to Firestore so the app has a consistent user object across both auth methods.

**2. SecureStore for tokens, AsyncStorage for app data**
JWT tokens go into Expo SecureStore (encrypted, sandboxed). Course cache, bookmarks, enrollments, and preferences use AsyncStorage.

**3. Typed WebView bridge**
Native-to-WebView messages use a typed contract so message shape mismatches are caught at compile time.

**4. Notification re-engagement reset**
The 24-hour reminder is cancelled and rescheduled every time the app comes to the foreground via an `AppState` listener. Users who open the app daily never see it.

---

## Known Issues / Limitations

| Issue | Notes |
|-------|-------|
| Google Sign-In not available in Expo Go | Requires EAS build (native module) |
| Profile avatar upload depends on freeapi.app endpoint availability | UI handles errors gracefully |
| Notifications not testable in Expo Go | Requires development/preview build |
| `--legacy-peer-deps` required on install | Expo SDK 56 preview + React 19 peer conflict |
