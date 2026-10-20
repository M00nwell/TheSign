# The Daily Sign

A daily omen app for web and iOS. Each day you open a card and get one omen, in English or Chinese,
drawn from that day's entry in the traditional Chinese almanac (黄历): the activities it marks as
favorable (宜) or unfavorable (忌), each reinterpreted for modern life.

**Live:** https://www.thedailysign.com/

Built solo, end to end, with Google Antigravity (Gemini and Claude models).

## Features

- **Daily card:** tear open a card pack with a drag gesture to reveal today's omen. It stays the same
  for the rest of the day.
- **Almanac-driven content:** the almanac for 2026-2028 is loaded into the database. Each day, the
  app picks one of that day's favorable or unfavorable activities, then one of its omens. There are
  388 hand-written omens across 194 activities, each with a short explanation of the original custom.
- **Bilingual:** every omen, explanation and activity name has an English and a Chinese version, and
  you can switch language in the app.
- **Accounts:** email/password, Google and Sign in with Apple, all through Supabase Auth. The web app
  uses cookie sessions; the mobile app calls the same API with a bearer token.
- **Sharing:** save today's card as an image and share it, using the native share sheet on mobile and
  the Web Share API (or a download) on web.

## Architecture

A Turborepo + pnpm monorepo in TypeScript.

| Path | What it is |
|------|------------|
| `apps/web` | Next.js 16 (App Router), Tailwind, Framer Motion. The server action `get-daily-omen.ts` and the `/api/daily-omen` route hold the selection logic. |
| `apps/mobile` | Expo 54 / React Native with Expo Router, NativeWind and Reanimated. iOS builds go through EAS. |
| `packages/api` | Supabase client, auth helpers and shared types, used by both apps. |
| `packages/ui` | Shared React components. |
| `data/` | Almanac data by year, plus the omen text for each favorable and unfavorable activity. |
| `scripts/` | Turns `data/` into SQL seed files for Supabase. |

**Supabase (Postgres)** stores the almanac, the activities and their translations, the omens and
their translations, and each user's omen for the day (`user_daily_omens`), which keeps a user's
draw stable for the whole day.

CI (GitHub Actions) installs, builds and lints the whole monorepo on every push to `main`.

## Running locally

Requires Node 20 and pnpm, plus a Supabase project.

```sh
pnpm install

# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...

pnpm --filter web dev      # http://localhost:3000
pnpm --filter mobile dev   # Expo dev server
```
