-- Enable Row Level Security
alter table public.mood_entries enable row level security;

-- Allow inserting rows only if user_id matches auth.uid()
create policy "Insert own entries" on public.mood_entries
  for insert with check (auth.uid() = user_id);

-- Allow selecting only own rows
create policy "Select own entries" on public.mood_entries
  for select using (auth.uid() = user_id);

-- Optionally allow updates of own rows (if you add edit feature later)
create policy "Update own entries" on public.mood_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Optionally allow deletion of own rows
create policy "Delete own entries" on public.mood_entries
  for delete using (auth.uid() = user_id);

-- If you still want anonymous (not signed in) inserts during transition, you can temporarily loosen with:
-- create policy "Temp anonymous insert" on public.mood_entries for insert with check (true);
-- Remember to drop that once auth is required:
-- drop policy "Temp anonymous insert" on public.mood_entries;
