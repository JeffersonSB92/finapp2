create table if not exists public.recurring_entries (
  sync_id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text,
  account_sync_id text references public.accounts(sync_id) on delete set null,
  person_sync_id text references public.people(sync_id) on delete set null,
  category_sync_id text references public.categories(sync_id) on delete set null,
  subcategory_sync_id text references public.subcategories(sync_id) on delete set null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  group_type text not null check (group_type in ('fixed', 'variable')),
  amount numeric not null,
  day_of_month integer not null check (day_of_month between 1 and 31),
  notes text,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_recurring_entries_household_id on public.recurring_entries (household_id);
create index if not exists idx_recurring_entries_user_id on public.recurring_entries (user_id);
create index if not exists idx_recurring_entries_updated_at on public.recurring_entries (updated_at);
create index if not exists idx_recurring_entries_day_of_month on public.recurring_entries (day_of_month);
create index if not exists idx_recurring_entries_account_sync_id on public.recurring_entries (account_sync_id);
create index if not exists idx_recurring_entries_person_sync_id on public.recurring_entries (person_sync_id);
create index if not exists idx_recurring_entries_category_sync_id on public.recurring_entries (category_sync_id);

alter table public.recurring_entries enable row level security;

drop policy if exists "recurring_entries_select_member" on public.recurring_entries;
drop policy if exists "recurring_entries_insert_member" on public.recurring_entries;
drop policy if exists "recurring_entries_update_member" on public.recurring_entries;
drop policy if exists "recurring_entries_delete_member" on public.recurring_entries;

create policy "recurring_entries_select_member" on public.recurring_entries
for select to authenticated
using (public.is_household_member(household_id));

create policy "recurring_entries_insert_member" on public.recurring_entries
for insert to authenticated
with check (public.is_household_member(household_id) and user_id = auth.uid());

create policy "recurring_entries_update_member" on public.recurring_entries
for update to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and user_id = auth.uid());

create policy "recurring_entries_delete_member" on public.recurring_entries
for delete to authenticated
using (public.is_household_member(household_id));
