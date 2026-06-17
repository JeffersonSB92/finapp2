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

alter table public.people add column if not exists household_id uuid;
alter table public.people add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table public.accounts add column if not exists household_id uuid;
alter table public.categories add column if not exists household_id uuid;
alter table public.subcategories add column if not exists household_id uuid;
alter table public.transactions add column if not exists household_id uuid;
alter table public.transactions add column if not exists installment_group_id text;
alter table public.transactions add column if not exists installment_index integer;
alter table public.transactions add column if not exists installment_count integer;
alter table public.planning add column if not exists household_id uuid;
alter table public.planning_settings add column if not exists household_id uuid;

with existing_users as (
  select distinct user_id from public.people where user_id is not null
  union
  select distinct user_id from public.accounts where user_id is not null
  union
  select distinct user_id from public.categories where user_id is not null
  union
  select distinct user_id from public.subcategories where user_id is not null
  union
  select distinct user_id from public.transactions where user_id is not null
  union
  select distinct user_id from public.planning where user_id is not null
  union
  select distinct user_id from public.planning_settings where user_id is not null
)
insert into public.households (owner_user_id, name)
select eu.user_id, 'Espaco principal'
from existing_users eu
where not exists (
  select 1 from public.households h where h.owner_user_id = eu.user_id
);

insert into public.household_members (
  household_id,
  user_id,
  role,
  invited_by_user_id,
  accepted_at
)
select h.id, h.owner_user_id, 'owner', h.owner_user_id, timezone('utc', now())
from public.households h
where not exists (
  select 1
  from public.household_members hm
  where hm.household_id = h.id and hm.user_id = h.owner_user_id
);

update public.people p
set household_id = h.id
from public.households h
where p.household_id is null
  and p.user_id = h.owner_user_id;

update public.people
set auth_user_id = user_id
where auth_user_id is null
  and user_id is not null;

update public.accounts a
set household_id = h.id
from public.households h
where a.household_id is null
  and a.user_id = h.owner_user_id;

update public.categories c
set household_id = h.id
from public.households h
where c.household_id is null
  and c.user_id = h.owner_user_id;

update public.subcategories s
set household_id = h.id
from public.households h
where s.household_id is null
  and s.user_id = h.owner_user_id;

update public.transactions t
set household_id = h.id
from public.households h
where t.household_id is null
  and t.user_id = h.owner_user_id;

update public.planning p
set household_id = h.id
from public.households h
where p.household_id is null
  and p.user_id = h.owner_user_id;

update public.planning_settings ps
set household_id = h.id
from public.households h
where ps.household_id is null
  and ps.user_id = h.owner_user_id;

alter table public.people
  alter column household_id set not null;
alter table public.accounts
  alter column household_id set not null;
alter table public.categories
  alter column household_id set not null;
alter table public.subcategories
  alter column household_id set not null;
alter table public.transactions
  alter column household_id set not null;
alter table public.planning
  alter column household_id set not null;
alter table public.planning_settings
  alter column household_id set not null;

alter table public.people
  drop constraint if exists people_household_id_fkey;
alter table public.accounts
  drop constraint if exists accounts_household_id_fkey;
alter table public.categories
  drop constraint if exists categories_household_id_fkey;
alter table public.subcategories
  drop constraint if exists subcategories_household_id_fkey;
alter table public.transactions
  drop constraint if exists transactions_household_id_fkey;
alter table public.planning
  drop constraint if exists planning_household_id_fkey;
alter table public.planning_settings
  drop constraint if exists planning_settings_household_id_fkey;

alter table public.people
  add constraint people_household_id_fkey
  foreign key (household_id) references public.households(id) on delete cascade;
alter table public.accounts
  add constraint accounts_household_id_fkey
  foreign key (household_id) references public.households(id) on delete cascade;
alter table public.categories
  add constraint categories_household_id_fkey
  foreign key (household_id) references public.households(id) on delete cascade;
alter table public.subcategories
  add constraint subcategories_household_id_fkey
  foreign key (household_id) references public.households(id) on delete cascade;
alter table public.transactions
  add constraint transactions_household_id_fkey
  foreign key (household_id) references public.households(id) on delete cascade;
alter table public.planning
  add constraint planning_household_id_fkey
  foreign key (household_id) references public.households(id) on delete cascade;
alter table public.planning_settings
  add constraint planning_settings_household_id_fkey
  foreign key (household_id) references public.households(id) on delete cascade;

create index if not exists idx_households_owner_user_id on public.households (owner_user_id);
create index if not exists idx_household_members_household_id on public.household_members (household_id);
create index if not exists idx_household_members_user_id on public.household_members (user_id);
create index if not exists idx_household_invites_household_id on public.household_invites (household_id);
create index if not exists idx_household_invites_token on public.household_invites (token);
create index if not exists idx_people_household_id on public.people (household_id);
create index if not exists idx_people_auth_user_id on public.people (auth_user_id);
create index if not exists idx_accounts_household_id on public.accounts (household_id);
create index if not exists idx_categories_household_id on public.categories (household_id);
create index if not exists idx_subcategories_household_id on public.subcategories (household_id);
create index if not exists idx_transactions_household_id on public.transactions (household_id);
create index if not exists idx_transactions_installment_group_id on public.transactions (installment_group_id);
create index if not exists idx_planning_household_id on public.planning (household_id);
create index if not exists idx_planning_settings_household_id on public.planning_settings (household_id);

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

drop policy if exists "people_select_own" on public.people;
drop policy if exists "people_insert_own" on public.people;
drop policy if exists "people_update_own" on public.people;
drop policy if exists "people_delete_own" on public.people;
drop policy if exists "accounts_select_own" on public.accounts;
drop policy if exists "accounts_insert_own" on public.accounts;
drop policy if exists "accounts_update_own" on public.accounts;
drop policy if exists "accounts_delete_own" on public.accounts;
drop policy if exists "categories_select_own" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;
drop policy if exists "subcategories_select_own" on public.subcategories;
drop policy if exists "subcategories_insert_own" on public.subcategories;
drop policy if exists "subcategories_update_own" on public.subcategories;
drop policy if exists "subcategories_delete_own" on public.subcategories;
drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
drop policy if exists "transactions_delete_own" on public.transactions;
drop policy if exists "planning_select_own" on public.planning;
drop policy if exists "planning_insert_own" on public.planning;
drop policy if exists "planning_update_own" on public.planning;
drop policy if exists "planning_delete_own" on public.planning;
drop policy if exists "planning_settings_select_own" on public.planning_settings;
drop policy if exists "planning_settings_insert_own" on public.planning_settings;
drop policy if exists "planning_settings_update_own" on public.planning_settings;
drop policy if exists "planning_settings_delete_own" on public.planning_settings;

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
