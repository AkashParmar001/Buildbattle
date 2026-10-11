create table feedback (
  id text primary key, text text not null, adapted_text text, category text,
  source text default 'sample', created_at timestamptz default now(), is_simulated_date boolean default false,
  sentiment text, sentiment_score real, topic text, cluster_id int, duplicate_count int default 1,
  weekly jsonb, quality_score real
);
create table clusters (
  id int primary key, label text, summary text, volume int, share real, negativity real,
  growth real, priority real, recommendation text, owner text, why text, weekly jsonb, examples jsonb
);
create table issues (
  id uuid primary key default gen_random_uuid(), cluster_id int references clusters(id),
  title text, status text default 'open' check (status in ('open','in_progress','resolved')),
  notes text, created_at timestamptz default now()
);
create table reports (
  id uuid primary key default gen_random_uuid(), share_token text unique, snapshot jsonb,
  created_at timestamptz default now()
);
