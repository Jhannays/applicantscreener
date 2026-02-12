-- Table to track all screened resumes and avoid duplicates
create table if not exists public.screened_resumes (
  id uuid primary key default gen_random_uuid(),
  req_id text not null,
  file_name text not null,
  file_hash text not null,
  candidate_name text not null,
  relevant_years integer not null default 0,
  relevant_months integer not null default 0,
  total_years integer not null default 0,
  total_months integer not null default 0,
  overall_match text not null default 'Weak',
  gap_present boolean not null default false,
  non_relevant_experience boolean not null default false,
  is_edge_case boolean not null default false,
  result_json jsonb not null,
  screened_at timestamptz not null default now(),

  -- Unique constraint: same file for same requisition
  constraint unique_req_file unique (req_id, file_hash)
);

-- No RLS needed since this is a single-user tool without auth
-- If auth is added later, enable RLS and add policies

-- Index for fast lookups by req_id + file_hash
create index if not exists idx_screened_resumes_req_hash on public.screened_resumes (req_id, file_hash);

-- Index for listing by date
create index if not exists idx_screened_resumes_date on public.screened_resumes (screened_at desc);
