-- Enable Anonymous Sign-Ins in the Supabase Auth dashboard if you want the
-- app to create a private guest session automatically on first launch.

create extension if not exists pgcrypto;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  type text not null default 'expense' check (type in ('expense', 'income')),
  category text not null default 'other' check (
    category in (
      'food',
      'movies',
      'shopping',
      'travel',
      'bills',
      'health',
      'education',
      'entertainment',
      'other'
    )
  ),
  merchant text,
  note text,
  location text,
  date timestamptz not null default timezone('utc', now()),
  source text not null default 'manual' check (source in ('manual', 'auto_detected')),
  raw_message text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists expenses_user_id_date_idx on public.expenses (user_id, date desc);

alter table public.expenses enable row level security;

create policy "expenses_select_own"
on public.expenses
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "expenses_insert_own"
on public.expenses
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "expenses_update_own"
on public.expenses
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "expenses_delete_own"
on public.expenses
for delete
to authenticated
using ((select auth.uid()) = user_id);
