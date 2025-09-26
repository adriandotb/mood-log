# Mood Tracker MVP

A lightning-fast (< 60s) daily mood + energy + anxiety + medication capture web app. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Supabase. Deployable on Vercel.

## Features (MVP)
- Record date
- Log up to 3 medications (name, dose, time, notes)
- Capture Mood / Energy / Anxiety for Morning, Noon, Afternoon, Evening (1–10 scale)
- Save to Supabase table `mood_entries`
- Responsive, keyboard-friendly UI

## Roadmap Ideas
- Auth (Supabase Auth) for multi-user
- Editable color themes (CSS variables / user prefs)
- Quick keyboard entry mode (1-0 keys)
- Analytics (averages, charts)
- Streaks & reminders (notifications/email)
- Export CSV

## Local Setup
1. Install deps:
```bash
npm install
```
2. Copy environment variables:
```bash
cp .env.local.example .env.local
```
3. Fill in your Supabase project URL and anon key in `.env.local`.
4. Create table (SQL below) in Supabase.
5. Run dev server:
```bash
npm run dev
```
6. Open http://localhost:3000

## Supabase Table Schema
```sql
create table public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  medications jsonb,
  slices jsonb not null,
  created_at timestamptz default now(),
  user_id uuid,
  constraint mood_entries_date_user unique (date, user_id)
);
```
(If not using auth yet, you can omit `user_id` & unique constraint.)

## Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Deployment (Vercel)
- Push to GitHub
- Import project in Vercel
- Add the 2 env vars
- Deploy

## Customization
- Edit colors in `tailwind.config.ts` or extend CSS variables in `app/globals.css`.

## License
MIT
