create extension if not exists "uuid-ossp";

create table if not exists public.deals (
  id uuid primary key default uuid_generate_v4(),
  external_id text unique,
  name text not null,
  account text not null,
  owner text not null,
  deal_stage text not null,
  opportunity_type text not null,
  deal_value numeric not null default 0,
  probability numeric not null default 0,
  stage_age_days integer not null default 0,
  inactivity_days integer not null default 0,
  engagement_score numeric not null default 0,
  meetings_count integer not null default 0,
  email_count integer not null default 0,
  competitor_mentioned boolean not null default false,
  next_step_defined boolean not null default false,
  close_date_pushed boolean not null default false,
  sentiment_score numeric not null default 0,
  forecast_trend text not null default 'stable',
  health_status text,
  ai_confidence integer,
  close_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_interactions (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid references public.deals(id) on delete cascade,
  channel text not null,
  actor text,
  content text,
  summary text,
  sentiment_label text,
  sentiment_score numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.deal_predictions (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid references public.deals(id) on delete cascade,
  prediction text not null,
  confidence integer not null,
  drivers jsonb not null default '[]'::jsonb,
  shap_factors jsonb not null default '[]'::jsonb,
  next_best_action text,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid references public.deals(id) on delete cascade,
  severity text not null,
  title text not null,
  message text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.deals enable row level security;
alter table public.deal_interactions enable row level security;
alter table public.deal_predictions enable row level security;
alter table public.alerts enable row level security;

create policy "authenticated read deals" on public.deals for select to authenticated using (true);
create policy "authenticated read interactions" on public.deal_interactions for select to authenticated using (true);
create policy "authenticated read predictions" on public.deal_predictions for select to authenticated using (true);
create policy "authenticated read alerts" on public.alerts for select to authenticated using (true);

insert into storage.buckets (id, name, public)
values ('deal-documents', 'deal-documents', false)
on conflict (id) do nothing;
