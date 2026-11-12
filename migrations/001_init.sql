create table if not exists babies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date not null,
  invite_code_hash text,
  invite_code_plain text,
  volume_unit text not null default 'oz' check (volume_unit in ('oz', 'ml')),
  weight_unit text not null default 'lb' check (weight_unit in ('lb', 'kg')),
  created_at timestamptz not null default now()
);

create table if not exists caregivers (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  viewer_sub text not null,
  display_name text not null,
  role text not null check (role in ('owner', 'caregiver')),
  created_at timestamptz not null default now(),
  unique (baby_id, viewer_sub)
);

create index if not exists caregivers_viewer_sub_idx on caregivers (viewer_sub);

create table if not exists feedings (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  caregiver_sub text not null,
  type text not null check (type in ('breast', 'bottle', 'formula')),
  side text check (side in ('left', 'right', 'both')),
  amount numeric,
  unit text check (unit in ('oz', 'ml')),
  started_at timestamptz not null,
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists feedings_baby_started_idx on feedings (baby_id, started_at desc);

create table if not exists diapers (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  caregiver_sub text not null,
  kind text not null check (kind in ('wet', 'dirty', 'both')),
  logged_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists diapers_baby_logged_idx on diapers (baby_id, logged_at desc);

create table if not exists sleeps (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  caregiver_sub text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists sleeps_baby_started_idx on sleeps (baby_id, started_at desc);

create table if not exists pumpings (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  caregiver_sub text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  amount_left numeric,
  amount_right numeric,
  amount_total numeric,
  unit text check (unit in ('oz', 'ml')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists pumpings_baby_started_idx on pumpings (baby_id, started_at desc);

create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  caregiver_sub text not null,
  name text not null,
  dose text not null,
  unit text,
  given_at timestamptz not null,
  due_again_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists medications_baby_given_idx on medications (baby_id, given_at desc);

create table if not exists growth (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  caregiver_sub text not null,
  weight numeric,
  weight_unit text check (weight_unit in ('lb', 'kg')),
  length numeric,
  length_unit text check (length_unit in ('in', 'cm')),
  measured_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists growth_baby_measured_idx on growth (baby_id, measured_at desc);
