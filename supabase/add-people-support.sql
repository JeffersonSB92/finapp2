-- Esta migracao cobre apenas a entidade "people" e foi superada para ambientes
-- colaborativos pela migracao `supabase/add-household-collaboration.sql`.

create table if not exists public.people (
  sync_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  color text,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.accounts
  add column if not exists owner_person_sync_id text;

alter table public.accounts
  drop constraint if exists accounts_owner_person_sync_id_fkey;

alter table public.accounts
  add constraint accounts_owner_person_sync_id_fkey
  foreign key (owner_person_sync_id)
  references public.people(sync_id)
  on delete restrict;

alter table public.transactions
  add column if not exists person_sync_id text;

alter table public.transactions
  add column if not exists installment_group_id text;

alter table public.transactions
  add column if not exists installment_index integer;

alter table public.transactions
  add column if not exists installment_count integer;

alter table public.transactions
  drop constraint if exists transactions_person_sync_id_fkey;

alter table public.transactions
  add constraint transactions_person_sync_id_fkey
  foreign key (person_sync_id)
  references public.people(sync_id)
  on delete restrict;

create index if not exists idx_people_user_id on public.people (user_id);
create index if not exists idx_people_auth_user_id on public.people (auth_user_id);
create index if not exists idx_people_updated_at on public.people (updated_at);
create index if not exists idx_accounts_owner_person_sync_id on public.accounts (owner_person_sync_id);
create index if not exists idx_transactions_person_sync_id on public.transactions (person_sync_id);
create index if not exists idx_transactions_installment_group_id on public.transactions (installment_group_id);

alter table public.people enable row level security;

drop policy if exists "people_select_own" on public.people;
drop policy if exists "people_insert_own" on public.people;
drop policy if exists "people_update_own" on public.people;
drop policy if exists "people_delete_own" on public.people;

create policy "people_select_own" on public.people
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "people_insert_own" on public.people
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "people_update_own" on public.people
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "people_delete_own" on public.people
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
