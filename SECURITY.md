# Security Policy

## Scope

This repository is a portfolio/showcase copy of Islame (Road to Islam). It contains no real user data, production API keys, or private signing material.

## Reporting a vulnerability

Please report security issues privately through GitHub's **Security** tab (private vulnerability reporting) rather than opening a public issue with exploit details.

## Security notes

- `.env` files are ignored; only `.env.example` is committed.
- The Supabase anon key is safe to ship to the client **only** when Row Level Security (RLS) policies are correctly configured. The anon key does not bypass RLS.
- Never expose a `service_role` key in a `VITE_*` variable; Vite bundles those variables into the browser/Android client.
- `android/app/google-services.json` is intentionally excluded. Add your own local copy if you build the Android app with Firebase Cloud Messaging.
- Admin bootstrap scripts and keystores are not part of this repository.
- If a credential is ever exposed, rotate it immediately in the provider dashboard and remove it from the repository history.
