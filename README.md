# Mood Tracker MVP

A lightning-fast (< 60s) daily mood + energy + anxiety + medication capture web app. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Supabase. Deployable on Vercel.

## Features (MVP)
- Record date
- Log up to 3 medications (name, dose, time, notes)
- Capture Mood / Energy / Anxiety for Morning, Noon, Afternoon, Evening (1–10 scale)
- Save to Supabase table `mood_entries`
- Responsive, keyboard-friendly UI
- Email magic-link auth (Supabase)
- Row Level Security policies (per-user data isolation)

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
  user_id uuid references auth.users(id),
  constraint mood_entries_date_user unique (date, user_id)
);
```
(If not using auth yet, you can omit `user_id` & unique constraint.)

### Enable RLS & Policies
```sql
alter table public.mood_entries enable row level security;
create policy "Insert own entries" on public.mood_entries for insert with check (auth.uid() = user_id);
create policy "Select own entries" on public.mood_entries for select using (auth.uid() = user_id);
create policy "Update own entries" on public.mood_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Delete own entries" on public.mood_entries for delete using (auth.uid() = user_id);
```

If you need a temporary anonymous phase:
```sql
create policy "Temp anonymous insert" on public.mood_entries for insert with check (true);
-- Later: drop policy "Temp anonymous insert" on public.mood_entries;
```

## Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# (Optional) Turn on email auth (magic link) in Supabase dashboard Auth settings.
```

## Deployment (Vercel)
- Push to GitHub
- Import project in Vercel
- Add the 2 env vars
- Deploy

## How Email/Password Auth Works Now
The app provides a compact sign in / sign up toggle (same panel). Choose Sign Up to create an account with email + password. After creation you are immediately signed in (no email verification flow required unless you enable it in Supabase settings). Switch to Sign In to log into an existing account. Use Sign Out to end the session.

Supabase Setup:
- In the Supabase Dashboard > Authentication > Providers: Ensure Email/Password is enabled.
- (Optional) Turn OFF "Confirm email" for faster onboarding (or leave it on if you want verification emails).
- (Optional) Enable rate limits / password rules as desired.

RLS still applies: rows are inserted with `user_id` only when authenticated. History queries filter by the current user's id.

Security Tips:
- Never commit service_role keys. Only the anon key is in the frontend.
- If enabling email confirmation, handle the "user must confirm" error in the panel (currently it will just display the error text).

History Page:
- Visit /history (link in the top-right) to view last 60 entries (date + average mood/energy/anxiety) plus mini sparkline trends.

## Customization
- Edit colors in `tailwind.config.ts` or extend CSS variables in `app/globals.css`.

## License
MIT

---
### Changelog
2025-09-26: Added auth + RLS documentation and initial dials UI improvements.
2025-09-26 (minor): Trigger redeploy with small README update.
