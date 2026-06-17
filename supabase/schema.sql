create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  invited_by_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (household_id, user_id)
);

create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.people (
  sync_id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
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

create table if not exists public.accounts (
  sync_id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text,
  owner_person_sync_id text references public.people(sync_id) on delete restrict,
  name text not null,
  type text not null,
  balance numeric not null default 0,
  currency text not null default 'BRL',
  color text,
  icon text,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  sync_id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text,
  name text not null,
  type text not null,
  color text,
  icon text,
  is_system boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subcategories (
  sync_id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text,
  category_sync_id text not null references public.categories(sync_id) on delete cascade,
  name text not null,
  color text,
  icon text,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transactions (
  sync_id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text,
  account_sync_id text not null references public.accounts(sync_id) on delete restrict,
  destination_account_sync_id text references public.accounts(sync_id) on delete restrict,
  person_sync_id text references public.people(sync_id) on delete restrict,
  installment_group_id text,
  installment_index integer,
  installment_count integer,
  category_sync_id text references public.categories(sync_id) on delete set null,
  subcategory_sync_id text references public.subcategories(sync_id) on delete set null,
  type text not null,
  amount numeric not null,
  description text,
  notes text,
  is_paid boolean not null default true,
  transaction_date timestamptz not null,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.planning (
  sync_id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text,
  year integer not null,
  month integer not null check (month between 1 and 12),
  category_sync_id text not null references public.categories(sync_id) on delete cascade,
  subcategory_sync_id text references public.subcategories(sync_id) on delete set null,
  planned_amount numeric not null,
  notes text,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.planning_settings (
  sync_id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text,
  essential_percentage numeric not null,
  non_essential_percentage numeric not null,
  savings_percentage numeric not null,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

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

create index if not exists idx_households_owner_user_id on public.households (owner_user_id);
create index if not exists idx_household_members_household_id on public.household_members (household_id);
create index if not exists idx_household_members_user_id on public.household_members (user_id);
create index if not exists idx_household_invites_household_id on public.household_invites (household_id);
create index if not exists idx_household_invites_token on public.household_invites (token);
create index if not exists idx_people_household_id on public.people (household_id);
create index if not exists idx_people_user_id on public.people (user_id);
create index if not exists idx_people_auth_user_id on public.people (auth_user_id);
create index if not exists idx_people_updated_at on public.people (updated_at);
create index if not exists idx_accounts_household_id on public.accounts (household_id);
create index if not exists idx_accounts_user_id on public.accounts (user_id);
create index if not exists idx_accounts_updated_at on public.accounts (updated_at);
create index if not exists idx_accounts_owner_person_sync_id on public.accounts (owner_person_sync_id);
create index if not exists idx_categories_household_id on public.categories (household_id);
create index if not exists idx_categories_user_id on public.categories (user_id);
create index if not exists idx_categories_updated_at on public.categories (updated_at);
create index if not exists idx_subcategories_household_id on public.subcategories (household_id);
create index if not exists idx_subcategories_user_id on public.subcategories (user_id);
create index if not exists idx_subcategories_updated_at on public.subcategories (updated_at);
create index if not exists idx_transactions_household_id on public.transactions (household_id);
create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_transactions_updated_at on public.transactions (updated_at);
create index if not exists idx_transactions_person_sync_id on public.transactions (person_sync_id);
create index if not exists idx_transactions_installment_group_id on public.transactions (installment_group_id);
create index if not exists idx_planning_household_id on public.planning (household_id);
create index if not exists idx_planning_user_id on public.planning (user_id);
create index if not exists idx_planning_updated_at on public.planning (updated_at);
create index if not exists idx_planning_settings_household_id on public.planning_settings (household_id);
create index if not exists idx_planning_settings_user_id on public.planning_settings (user_id);
create index if not exists idx_planning_settings_updated_at on public.planning_settings (updated_at);
create index if not exists idx_recurring_entries_household_id on public.recurring_entries (household_id);
create index if not exists idx_recurring_entries_user_id on public.recurring_entries (user_id);
create index if not exists idx_recurring_entries_updated_at on public.recurring_entries (updated_at);
create index if not exists idx_recurring_entries_day_of_month on public.recurring_entries (day_of_month);
create index if not exists idx_recurring_entries_account_sync_id on public.recurring_entries (account_sync_id);
create index if not exists idx_recurring_entries_person_sync_id on public.recurring_entries (person_sync_id);
create index if not exists idx_recurring_entries_category_sync_id on public.recurring_entries (category_sync_id);

create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
  );
$$;

create or replace function public.is_household_owner(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.households h
    where h.id = p_household_id
      and h.owner_user_id = auth.uid()
  );
$$;

create or replace function public.accept_household_invite(p_token text)
returns table (
  household_id uuid,
  household_name text,
  role text,
  owner_user_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.household_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
    into v_invite
  from public.household_invites
  where token = p_token
  limit 1;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_invite.accepted_at is not null then
    raise exception 'INVITE_ALREADY_ACCEPTED';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < timezone('utc', now()) then
    raise exception 'INVITE_EXPIRED';
  end if;

  insert into public.household_members (
    household_id,
    user_id,
    role,
    invited_by_user_id,
    accepted_at
  )
  values (
    v_invite.household_id,
    auth.uid(),
    'member',
    v_invite.created_by_user_id,
    timezone('utc', now())
  )
  on conflict (household_id, user_id) do update
  set
    accepted_at = excluded.accepted_at,
    invited_by_user_id = excluded.invited_by_user_id;

  update public.household_invites
  set
    accepted_at = timezone('utc', now()),
    accepted_by_user_id = auth.uid(),
    updated_at = timezone('utc', now())
  where id = v_invite.id;

  return query
  select
    h.id,
    h.name,
    'member'::text,
    h.owner_user_id
  from public.households h
  where h.id = v_invite.household_id;
end;
$$;

grant execute on function public.accept_household_invite(text) to authenticated;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.people enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.transactions enable row level security;
alter table public.planning enable row level security;
alter table public.planning_settings enable row level security;
alter table public.recurring_entries enable row level security;

drop policy if exists "households_select_member" on public.households;
drop policy if exists "households_insert_owner" on public.households;
drop policy if exists "households_update_owner" on public.households;
drop policy if exists "households_delete_owner" on public.households;
create policy "households_select_member" on public.households
for select to authenticated
using (public.is_household_member(id) or owner_user_id = auth.uid());
create policy "households_insert_owner" on public.households
for insert to authenticated
with check (owner_user_id = auth.uid());
create policy "households_update_owner" on public.households
for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());
create policy "households_delete_owner" on public.households
for delete to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "household_members_select_member" on public.household_members;
drop policy if exists "household_members_insert_owner" on public.household_members;
drop policy if exists "household_members_update_owner" on public.household_members;
drop policy if exists "household_members_delete_owner" on public.household_members;
create policy "household_members_select_member" on public.household_members
for select to authenticated
using (public.is_household_member(household_id) or public.is_household_owner(household_id));
create policy "household_members_insert_owner" on public.household_members
for insert to authenticated
with check (public.is_household_owner(household_id) and invited_by_user_id = auth.uid());
create policy "household_members_update_owner" on public.household_members
for update to authenticated
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));
create policy "household_members_delete_owner" on public.household_members
for delete to authenticated
using (public.is_household_owner(household_id));

drop policy if exists "household_invites_select_owner" on public.household_invites;
drop policy if exists "household_invites_insert_owner" on public.household_invites;
drop policy if exists "household_invites_update_owner" on public.household_invites;
drop policy if exists "household_invites_delete_owner" on public.household_invites;
create policy "household_invites_select_owner" on public.household_invites
for select to authenticated
using (public.is_household_owner(household_id));
create policy "household_invites_insert_owner" on public.household_invites
for insert to authenticated
with check (public.is_household_owner(household_id) and created_by_user_id = auth.uid());
create policy "household_invites_update_owner" on public.household_invites
for update to authenticated
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));
create policy "household_invites_delete_owner" on public.household_invites
for delete to authenticated
using (public.is_household_owner(household_id));

drop policy if exists "people_select_member" on public.people;
drop policy if exists "people_insert_member" on public.people;
drop policy if exists "people_update_member" on public.people;
drop policy if exists "people_delete_member" on public.people;
create policy "people_select_member" on public.people
for select to authenticated
using (public.is_household_member(household_id));
create policy "people_insert_member" on public.people
for insert to authenticated
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "people_update_member" on public.people
for update to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "people_delete_member" on public.people
for delete to authenticated
using (public.is_household_member(household_id));

drop policy if exists "accounts_select_member" on public.accounts;
drop policy if exists "accounts_insert_member" on public.accounts;
drop policy if exists "accounts_update_member" on public.accounts;
drop policy if exists "accounts_delete_member" on public.accounts;
create policy "accounts_select_member" on public.accounts
for select to authenticated
using (public.is_household_member(household_id));
create policy "accounts_insert_member" on public.accounts
for insert to authenticated
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "accounts_update_member" on public.accounts
for update to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "accounts_delete_member" on public.accounts
for delete to authenticated
using (public.is_household_member(household_id));

drop policy if exists "categories_select_member" on public.categories;
drop policy if exists "categories_insert_member" on public.categories;
drop policy if exists "categories_update_member" on public.categories;
drop policy if exists "categories_delete_member" on public.categories;
create policy "categories_select_member" on public.categories
for select to authenticated
using (public.is_household_member(household_id));
create policy "categories_insert_member" on public.categories
for insert to authenticated
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "categories_update_member" on public.categories
for update to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "categories_delete_member" on public.categories
for delete to authenticated
using (public.is_household_member(household_id));

drop policy if exists "subcategories_select_member" on public.subcategories;
drop policy if exists "subcategories_insert_member" on public.subcategories;
drop policy if exists "subcategories_update_member" on public.subcategories;
drop policy if exists "subcategories_delete_member" on public.subcategories;
create policy "subcategories_select_member" on public.subcategories
for select to authenticated
using (public.is_household_member(household_id));
create policy "subcategories_insert_member" on public.subcategories
for insert to authenticated
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "subcategories_update_member" on public.subcategories
for update to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "subcategories_delete_member" on public.subcategories
for delete to authenticated
using (public.is_household_member(household_id));

drop policy if exists "transactions_select_member" on public.transactions;
drop policy if exists "transactions_insert_member" on public.transactions;
drop policy if exists "transactions_update_member" on public.transactions;
drop policy if exists "transactions_delete_member" on public.transactions;
create policy "transactions_select_member" on public.transactions
for select to authenticated
using (public.is_household_member(household_id));
create policy "transactions_insert_member" on public.transactions
for insert to authenticated
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "transactions_update_member" on public.transactions
for update to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "transactions_delete_member" on public.transactions
for delete to authenticated
using (public.is_household_member(household_id));

drop policy if exists "planning_select_member" on public.planning;
drop policy if exists "planning_insert_member" on public.planning;
drop policy if exists "planning_update_member" on public.planning;
drop policy if exists "planning_delete_member" on public.planning;
create policy "planning_select_member" on public.planning
for select to authenticated
using (public.is_household_member(household_id));
create policy "planning_insert_member" on public.planning
for insert to authenticated
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "planning_update_member" on public.planning
for update to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "planning_delete_member" on public.planning
for delete to authenticated
using (public.is_household_member(household_id));

drop policy if exists "planning_settings_select_member" on public.planning_settings;
drop policy if exists "planning_settings_insert_member" on public.planning_settings;
drop policy if exists "planning_settings_update_member" on public.planning_settings;
drop policy if exists "planning_settings_delete_member" on public.planning_settings;
create policy "planning_settings_select_member" on public.planning_settings
for select to authenticated
using (public.is_household_member(household_id));
create policy "planning_settings_insert_member" on public.planning_settings
for insert to authenticated
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "planning_settings_update_member" on public.planning_settings
for update to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and user_id = auth.uid());
create policy "planning_settings_delete_member" on public.planning_settings
for delete to authenticated
using (public.is_household_member(household_id));

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
