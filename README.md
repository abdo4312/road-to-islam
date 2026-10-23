# 🕌 Islame (Road to Islam)

An Islamic Android companion app built for Muslims who want prayer times, the Adhan, Qibla direction, and guided mentorship in one place.

It shows live prayer times from your location, plays the Adhan at the right moments, points you toward the Qibla, and connects you with mentors so new and returning Muslims can learn the basics of the faith step by step.

> **Status:** Portfolio showcase. This repository contains no real user data, API keys, or production credentials.
>
> **Live demo:** local/APK only — this is a native Android (Capacitor) app, not a hosted web page.

## Features

- **Prayer Times** — Location-aware prayer times with automatic refresh.
- **Adhan Alarms** — Adhan audio playback at each prayer time, with configurable notification settings.
- **Qibla Direction** — Compass/direction helper to locate the Qibla from anywhere.
- **Mentor System** — Connect with mentors for guided Islamic learning.
- **Gamified Journey** — Track daily prayers, habits, and streaks to stay consistent.
- **Multilingual UI** — Arabic, English, French, Turkish, and Urdu.

## Tech Stack

- [React 19](https://react.dev/) — UI
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Vite 6](https://vite.dev/) — Build tool
- [Capacitor 8](https://capacitorjs.com/) — Native Android wrapper
- [Supabase](https://supabase.com/) — Authentication, Postgres, and row-level security
- [Tailwind CSS v4](https://tailwindcss.com/) — Styling
- [Howler.js](https://howlerjs.com/) — Adhan audio playback
- [i18next](https://www.i18next.com/) — Internationalisation
- [TanStack Query](https://tanstack.com/query/latest) — Data fetching

## Getting Started

### Requirements

- Node.js 20+
- Android Studio (for the Android build)

### Web development

```bash
npm install
cp .env.example .env   # add your Supabase URL and anon key
npm run dev
```

### Android build

```bash
npm run build
npx cap sync android
npx cap open android
```

The Android project uses Firebase Cloud Messaging. Add your own
`android/app/google-services.json` before building; it is intentionally not
committed. Without it, the Google Services Gradle plugin cannot configure the
Android build.

## Project Structure

```text
road-to-islam/
├── src/
│   ├── components/     # Shared UI and overlays
│   ├── screens/        # App and admin screens
│   ├── hooks/          # Prayer times, Qibla, location, progress
│   ├── services/       # Prayer API, lectures, subjects, push
│   ├── lib/            # Supabase client, adhan audio, sync
│   ├── i18n/           # Arabic, English, French, Turkish, Urdu
│   └── contexts/       # Auth and app-wide state
├── android/            # Capacitor Android project
├── docs/               # SQL schema and setup notes
├── public/             # Static assets and audio
└── assets/             # App icon and splash sources
```

## Architecture

- React renders the app; Capacitor exposes native Android capabilities through plugins.
- Supabase handles authentication and cloud data; only the public anon key is used in the client.
- Prayer times come from the Aladhan API, while location search uses OpenStreetMap Nominatim.
- Adhan playback, local notifications, and the foreground service are handled on the native side.
- A service worker (Vite PWA) caches the web shell and selected API responses.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the data-flow diagram.

## Security

- `.env` is ignored; only `.env.example` is committed.
- The client uses a Supabase **anon** key, which is public by design; access control must be enforced with Row Level Security (RLS).
- Never put a `service_role` key in `VITE_*` variables.
- Admin bootstrap scripts and signing material are not part of this repository.
- `android/app/google-services.json` is ignored and must be supplied locally.

See [SECURITY.md](SECURITY.md) for reporting and deployment notes.

## License

MIT — see [LICENSE](LICENSE).
