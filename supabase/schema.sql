-- ============================================================
-- VIINA — Supabase schema
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
-- ============================================================

-- One row per admin-editable content "slice" (products, theme,
-- header, custom pages, routine bundles, etc). The app's own code
-- decides what each `id` / `data` shape means — this table is
-- intentionally generic so every admin screen keeps working without
-- a separate SQL table + migration per feature.
create table if not exists public.site_content (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: OFF by default lets nobody in; we turn it ON
-- and then explicitly allow exactly two things:
--   1. Anyone (including anonymous storefront visitors) can READ —
--      required for the public site to load its content at all.
--   2. Only a signed-in Supabase Auth user (your admin) can WRITE —
--      this is what makes the admin login real security instead of
--      a client-side password check anyone could bypass in devtools.
alter table public.site_content enable row level security;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
  on public.site_content
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Only signed-in admins can write site content" on public.site_content;
create policy "Only signed-in admins can write site content"
  on public.site_content
  for all
  to authenticated
  using (true)
  with check (true);

-- Keep updated_at accurate even on direct SQL edits (the app also
-- sets it from JS on every save — this is just a safety net).
create or replace function public.touch_site_content_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists touch_site_content on public.site_content;
create trigger touch_site_content
  before update on public.site_content
  for each row execute function public.touch_site_content_updated_at();
