-- ============================================================
-- FIELDSNAP — Clean Schema (run this in Supabase SQL Editor)
-- ============================================================

-- Drop everything first so we start clean
drop table if exists notifications cascade;
drop table if exists comments cascade;
drop table if exists work_logs cascade;
drop table if exists pay_rates cascade;
drop table if exists tasks cascade;
drop table if exists property_contractors cascade;
drop table if exists properties cascade;
drop table if exists profiles cascade;

-- ── PROFILES ─────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  phone       text,
  email       text,
  photo_url   text,
  role        text not null default 'contractor' check (role in ('owner','contractor')),
  language    text not null default 'en' check (language in ('en','es')),
  created_at  timestamptz default now()
);
alter table profiles enable row level security;
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- ── PROPERTIES ───────────────────────────────────────────────
create table properties (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid references profiles(id) on delete cascade,
  name             text not null,
  street           text,
  city             text,
  state            text,
  zip              text,
  cover_photo_url  text,
  status           text not null default 'active' check (status in ('active','completed')),
  created_at       timestamptz default now()
);
alter table properties enable row level security;
create policy "properties_select" on properties for select using (
  owner_id = auth.uid() or
  exists (select 1 from property_contractors where property_id = properties.id and contractor_id = auth.uid())
);
create policy "properties_insert" on properties for insert with check (owner_id = auth.uid());
create policy "properties_update" on properties for update using (owner_id = auth.uid());
create policy "properties_delete" on properties for delete using (owner_id = auth.uid());

-- ── PROPERTY_CONTRACTORS ─────────────────────────────────────
create table property_contractors (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid references properties(id) on delete cascade,
  contractor_id  uuid references profiles(id) on delete cascade,
  created_at     timestamptz default now(),
  unique(property_id, contractor_id)
);
alter table property_contractors enable row level security;
create policy "pc_select" on property_contractors for select using (true);
create policy "pc_insert" on property_contractors for insert with check (
  exists (select 1 from properties where id = property_id and owner_id = auth.uid())
);
create policy "pc_delete" on property_contractors for delete using (
  exists (select 1 from properties where id = property_id and owner_id = auth.uid())
);

-- ── TASKS ────────────────────────────────────────────────────
create table tasks (
  id                    uuid primary key default gen_random_uuid(),
  property_id           uuid references properties(id) on delete cascade,
  created_by            uuid references profiles(id),
  completed_by          uuid references profiles(id),
  title_en              text,
  title_es              text,
  photo_url             text,
  due_date              date,
  status                text not null default 'open' check (status in ('open','completed')),
  completed_at          timestamptz,
  completion_photo_url  text,
  created_at            timestamptz default now()
);
alter table tasks enable row level security;
create policy "tasks_select" on tasks for select using (
  exists (
    select 1 from properties p
    left join property_contractors pc on pc.property_id = p.id
    where p.id = tasks.property_id
      and (p.owner_id = auth.uid() or pc.contractor_id = auth.uid())
  )
);
create policy "tasks_insert" on tasks for insert with check (
  exists (
    select 1 from properties p
    left join property_contractors pc on pc.property_id = p.id
    where p.id = property_id
      and (p.owner_id = auth.uid() or pc.contractor_id = auth.uid())
  )
);
create policy "tasks_update" on tasks for update using (
  exists (
    select 1 from properties p
    left join property_contractors pc on pc.property_id = p.id
    where p.id = tasks.property_id
      and (p.owner_id = auth.uid() or pc.contractor_id = auth.uid())
  )
);

-- ── COMMENTS ─────────────────────────────────────────────────
create table comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid references tasks(id) on delete cascade,
  user_id     uuid references profiles(id),
  body_en     text,
  body_es     text,
  created_at  timestamptz default now()
);
alter table comments enable row level security;
create policy "comments_select" on comments for select using (
  exists (
    select 1 from tasks tk
    join properties p on p.id = tk.property_id
    left join property_contractors pc on pc.property_id = p.id
    where tk.id = comments.task_id
      and (p.owner_id = auth.uid() or pc.contractor_id = auth.uid())
  )
);
create policy "comments_insert" on comments for insert with check (user_id = auth.uid());

-- ── NOTIFICATIONS ─────────────────────────────────────────────
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  type        text not null default 'mention',
  task_id     uuid references tasks(id) on delete cascade,
  comment_id  uuid references comments(id) on delete cascade,
  read        boolean not null default false,
  created_at  timestamptz default now()
);
alter table notifications enable row level security;
create policy "notif_select" on notifications for select using (user_id = auth.uid());
create policy "notif_insert" on notifications for insert with check (true);
create policy "notif_update" on notifications for update using (user_id = auth.uid());

-- ── WORK_LOGS ─────────────────────────────────────────────────
create table work_logs (
  id             uuid primary key default gen_random_uuid(),
  contractor_id  uuid references profiles(id) on delete cascade,
  property_id    uuid references properties(id) on delete cascade,
  log_date       date not null,
  day_type       text not null check (day_type in ('full','half')),
  slot           int not null default 1,
  created_at     timestamptz default now(),
  unique(contractor_id, property_id, log_date, slot)
);
alter table work_logs enable row level security;
create policy "worklogs_select" on work_logs for select using (
  contractor_id = auth.uid() or
  exists (select 1 from properties where id = property_id and owner_id = auth.uid())
);
create policy "worklogs_insert" on work_logs for insert with check (contractor_id = auth.uid());
create policy "worklogs_update" on work_logs for update using (contractor_id = auth.uid());

-- ── PAY_RATES ─────────────────────────────────────────────────
create table pay_rates (
  id                uuid primary key default gen_random_uuid(),
  contractor_id     uuid references profiles(id) on delete cascade unique,
  pay_type          text not null check (pay_type in ('hourly','daily','weekly','gc')),
  rate              numeric(10,2) not null,
  set_by_owner_id   uuid references profiles(id),
  created_at        timestamptz default now()
);
alter table pay_rates enable row level security;
create policy "payrates_all" on pay_rates for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'owner')
);

-- ── REALTIME ─────────────────────────────────────────────────
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table tasks;

-- ── STORAGE BUCKET ───────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('fieldsnap-uploads', 'fieldsnap-uploads', true)
on conflict do nothing;

create policy "storage_select" on storage.objects for select using (bucket_id = 'fieldsnap-uploads');
create policy "storage_insert" on storage.objects for insert with check (bucket_id = 'fieldsnap-uploads' and auth.role() = 'authenticated');
create policy "storage_update" on storage.objects for update using (auth.role() = 'authenticated');
