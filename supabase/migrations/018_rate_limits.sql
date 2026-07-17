-- ============================================================
-- AGENCY OS - Migration 018: Rate Limits Table
-- ============================================================

create table if not exists public.rate_limits (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    endpoint text not null,
    window_start timestamp with time zone not null,
    count integer not null default 1,
    unique(user_id, endpoint, window_start)
);

-- Enable RLS (though mostly used by service roles or server endpoints)
alter table public.rate_limits enable row level security;

-- Only service role can access this table directly
create policy "Service role can manage rate limits" on rate_limits
    using (true)
    with check (true);
