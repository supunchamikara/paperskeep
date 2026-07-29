-- ============================================================
-- Standalone migration: EV charging stations.
-- Idempotent — safe to run on an already-deployed database.
-- Identical to the ev_stations block in supabase/schema.sql,
-- extracted so it can be pasted straight into the SQL Editor.
-- ============================================================
create table if not exists public.ev_stations (
  id               uuid primary key default gen_random_uuid(),
  station_id       text unique not null,        -- e.g. SL-0001
  station_name     text not null,
  operator_network text,
  district         text,
  province         text,
  address          text,
  charger_level    text,                        -- e.g. "DC Fast"
  connector_types  text,                        -- e.g. "CCS2, CHAdeMO"
  power_kw         text,                        -- kept as text ("30 kW"); some rows blank
  latitude         double precision,
  longitude        double precision,
  maps_link        text,
  access           text,
  status           text default 'active',
  source           text,
  last_verified    date,
  added_phase      text,
  -- 'exact'       — coordinates from the operator or a mapped OSM POI
  -- 'approximate' — geocoded to the street/area only; good enough to find the
  --                 neighbourhood, not to navigate the last 500 m
  geo_precision    text default 'exact'
);


-- Additive migration for databases created before geo_precision existed
-- (`create table if not exists` above is a no-op for them).
alter table public.ev_stations
  add column if not exists geo_precision text default 'exact';

-- Supports the bounds-filtered viewport query the map will move to once the
-- table grows past a few thousand rows (see the TODO in components/ev/EvMap.tsx).
create index if not exists ev_stations_geo_idx
  on public.ev_stations (latitude, longitude);

alter table public.ev_stations enable row level security;

-- Station data is public reference information: anyone may read it, nobody
-- may write it with the publishable key.
drop policy if exists "public read ev_stations" on public.ev_stations;
create policy "public read ev_stations"
  on public.ev_stations
  for select
  to anon, authenticated
  using (true);
