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

-- ============================================================
-- Storage bucket for product/banner/hero images uploaded from the
-- Admin Panel (see uploadProductImage() in src/App.jsx). Public so
-- the resulting URLs work for every visitor, same read/write split
-- as site_content: anyone can view images, only a signed-in admin
-- can upload/replace/delete them.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'products');

drop policy if exists "Only signed-in admins can upload product images" on storage.objects;
create policy "Only signed-in admins can upload product images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'products');

drop policy if exists "Only signed-in admins can update product images" on storage.objects;
create policy "Only signed-in admins can update product images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'products');

drop policy if exists "Only signed-in admins can delete product images" on storage.objects;
create policy "Only signed-in admins can delete product images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'products');

-- ============================================================
-- Storage bucket for payment receipts uploaded by shoppers at
-- checkout (see uploadReceiptImage() in src/App.jsx). Shoppers are
-- never signed in to Supabase Auth, so — unlike the 'products'
-- bucket above — anyone (anon) must be allowed to upload here.
-- Public so the admin panel can show the receipt image; nobody
-- (not even admins, via the client) can update/delete a receipt,
-- since it's evidence of what the customer actually sent.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view payment receipts" on storage.objects;
create policy "Public can view payment receipts"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'receipts');

drop policy if exists "Anyone can upload a payment receipt" on storage.objects;
create policy "Anyone can upload a payment receipt"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'receipts');

-- ============================================================
-- Phone OTP codes (login verification, sent via sms.ir — see the
-- send-otp / verify-otp Edge Functions). Only the hash is stored,
-- never the plain code. No RLS policies are defined on purpose: this
-- table has no anon/authenticated grants at all, so only the Edge
-- Functions (which use the service-role key and bypass RLS) can ever
-- read or write it — the browser can't touch it directly.
-- ============================================================
create table if not exists otp_codes (
  id bigint generated always as identity primary key,
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
alter table otp_codes enable row level security;
create index if not exists otp_codes_phone_created_idx on otp_codes (phone, created_at desc);
