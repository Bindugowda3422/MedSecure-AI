-- MedSecure AI — initial schema
-- Demonstration/educational dataset. Not a certified pharmaceutical database.

create extension if not exists "pgcrypto";

-- ============ profiles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- ============ medicines ============
create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  medicine_id text not null unique,               -- e.g. MED-IND-2026-000001 (public identifier)
  name text not null,
  composition text not null,
  dosage text,
  uses text,
  side_effects text,
  prescription_required boolean not null default false,
  manufacturer text not null,
  batch_number text not null,
  manufacturing_date date,
  expiry_date date,
  medicine_hash text not null,                    -- current SHA-256 of canonical record
  blockchain_tx_hash text,
  blockchain_status text not null default 'PENDING'
    check (blockchain_status in ('PENDING', 'REGISTERED', 'FAILED')),
  is_demo boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_medicines_medicine_id on public.medicines (medicine_id);
create index if not exists idx_medicines_batch on public.medicines (batch_number);

-- ============ verification_logs ============
create table if not exists public.verification_logs (
  id uuid primary key default gen_random_uuid(),
  medicine_id text not null,                       -- public identifier scanned, even if unknown
  verification_result text not null
    check (verification_result in ('VERIFIED', 'FAILED', 'UNKNOWN')),
  database_hash text,
  blockchain_hash text,
  blockchain_status text,
  ip_hint text,
  timestamp timestamptz not null default now()
);

create index if not exists idx_logs_medicine_id on public.verification_logs (medicine_id);
create index if not exists idx_logs_timestamp on public.verification_logs (timestamp desc);

-- ============ updated_at trigger ============
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_medicines_updated_at on public.medicines;
create trigger trg_medicines_updated_at
before update on public.medicines
for each row execute function public.set_updated_at();

-- ============ profile auto-create on signup ============
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ Row Level Security ============
alter table public.profiles enable row level security;
alter table public.medicines enable row level security;
alter table public.verification_logs enable row level security;

-- profiles: users can read their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- medicines: anyone (incl. anonymous) can read — verification is a public flow
create policy "medicines_public_read" on public.medicines
  for select using (true);

-- medicines: only admins can insert/update (checked via profiles.role)
create policy "medicines_admin_insert" on public.medicines
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "medicines_admin_update" on public.medicines
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- verification_logs: public can insert (anonymous scans log too) and read (dashboard is semi-public in this MVP)
create policy "logs_public_insert" on public.verification_logs
  for insert with check (true);

create policy "logs_public_read" on public.verification_logs
  for select using (true);

comment on table public.medicines is 'Demonstration medicine registry. Not government/pharma certified.';
