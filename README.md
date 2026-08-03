# Islame (Road to Islam)

An Islamic Android companion app built for Muslims who want prayer times, the Adhan, Qibla direction, and guided mentorship in one place.

It shows live prayer times from your location, plays the Adhan at the right moments, points you toward the Qibla, and connects you with mentors so new and returning Muslims can learn the basics of the faith step by step.

## Features

- **Prayer Times** – Accurate, location-aware prayer times with automatic refresh.
- **Adhan Alarms** – Real-time Adhan audio playback at each prayer time, with configurable notification settings.
- **Qibla Direction** – Compass/direction helper to locate the Qibla from anywhere.
- **Mentor System** – Connect with mentors for guided Islamic learning.
- **Gamified Journey** – Track daily prayers, habits, and streaks to stay consistent.
- **Exact Multilingual Support** – Arabic and English localised UI.

## Tech Stack

- [React 19](https://react.dev/) – UI
- [TypeScript](https://www.typescriptlang.org/) – Type safety
- [Vite 6](https://vitejs.dev/) – Build tool
- [Capacitor 8](https://capacitorjs.com/) – Native Android wrapper
- [Supabase](https://supabase.com/) – Backend & authentication
- [Tailwind CSS v4](https://tailwindcss.com/) – Styling
- [Howler.js](https://howlerjs.com/) – Adhan audio playback
- [i18next](https://www.i18next.com/) – Internationalisation
- [React Query](https://tanstack.com/query/latest) – Data fetching

## Getting Started

```bash
npm install
cp .env.example .env   # add your Supabase keys
npm run dev
```

### Build Android APK

```bash
npm run build
npx cap sync android
npx cap open android
```

## Status

> **Live / Demo:** local & APK only — this is a native Android (Capacitor) app, not a hosted web page. Build the APK to run it.