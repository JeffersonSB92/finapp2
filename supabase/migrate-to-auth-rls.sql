alter table public.accounts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.categories add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.subcategories add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.transactions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.planning add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.planning_settings add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists idx_accounts_user_id on public.accounts (user_id);
create index if not exists idx_categories_user_id on public.categories (user_id);
create index if not exists idx_subcategories_user_id on public.subcategories (user_id);
create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_planning_user_id on public.planning (user_id);
create index if not exists idx_planning_settings_user_id on public.planning_settings (user_id);

alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.transactions enable row level security;
alter table public.planning enable row level security;
alter table public.planning_settings enable row level security;

drop policy if exists "accounts_select_own" on public.accounts;
drop policy if exists "accounts_insert_own" on public.accounts;
drop policy if exists "accounts_update_own" on public.accounts;
drop policy if exists "accounts_delete_own" on public.accounts;
create policy "accounts_select_own" on public.accounts
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "accounts_insert_own" on public.accounts
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "accounts_update_own" on public.accounts
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "accounts_delete_own" on public.accounts
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "categories_select_own" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_select_own" on public.categories
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "categories_insert_own" on public.categories
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "categories_update_own" on public.categories
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "categories_delete_own" on public.categories
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "subcategories_select_own" on public.subcategories;
drop policy if exists "subcategories_insert_own" on public.subcategories;
drop policy if exists "subcategories_update_own" on public.subcategories;
drop policy if exists "subcategories_delete_own" on public.subcategories;
create policy "subcategories_select_own" on public.subcategories
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "subcategories_insert_own" on public.subcategories
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "subcategories_update_own" on public.subcategories
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "subcategories_delete_own" on public.subcategories
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "transactions_insert_own" on public.transactions
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "transactions_update_own" on public.transactions
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "transactions_delete_own" on public.transactions
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "planning_select_own" on public.planning;
drop policy if exists "planning_insert_own" on public.planning;
drop policy if exists "planning_update_own" on public.planning;
drop policy if exists "planning_delete_own" on public.planning;
create policy "planning_select_own" on public.planning
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "planning_insert_own" on public.planning
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "planning_update_own" on public.planning
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "planning_delete_own" on public.planning
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "planning_settings_select_own" on public.planning_settings;
drop policy if exists "planning_settings_insert_own" on public.planning_settings;
drop policy if exists "planning_settings_update_own" on public.planning_settings;
drop policy if exists "planning_settings_delete_own" on public.planning_settings;
create policy "planning_settings_select_own" on public.planning_settings
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "planning_settings_insert_own" on public.planning_settings
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "planning_settings_update_own" on public.planning_settings
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "planning_settings_delete_own" on public.planning_settings
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
