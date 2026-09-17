-- ============================================================
-- Tour de Rôle — schéma Supabase
-- À exécuter dans l'éditeur SQL de Supabase, ou via :
--   supabase db push
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- Profils patients (liés à auth.users une fois l'OTP validé)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text unique not null,
  preferred_centre_id uuid,
  notifications_sms boolean not null default true,
  language text not null default 'fr',
  role text not null default 'patient' check (role in ('patient', 'agent', 'admin')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Centres de santé
-- ------------------------------------------------------------
create table if not exists public.centres (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  city text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_preferred_centre_fk
  foreign key (preferred_centre_id) references public.centres(id) on delete set null;

-- ------------------------------------------------------------
-- Services proposés par un centre (médecine générale, pédiatrie...)
-- ------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default uuid_generate_v4(),
  centre_id uuid not null references public.centres(id) on delete cascade,
  name text not null,
  duration_minutes int not null default 20,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Créneaux disponibles (générés à l'avance par les agents)
-- ------------------------------------------------------------
create table if not exists public.slots (
  id uuid primary key default uuid_generate_v4(),
  service_id uuid not null references public.services(id) on delete cascade,
  starts_at timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Rendez-vous
-- ------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  centre_id uuid not null references public.centres(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  slot_id uuid references public.slots(id) on delete set null,
  scheduled_at timestamptz not null,
  status text not null default 'confirme' check (status in ('confirme', 'termine', 'annule', 'absent')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- File d'attente virtuelle (un ticket par rendez-vous du jour)
-- ------------------------------------------------------------
create table if not exists public.queue_tickets (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  centre_id uuid not null references public.centres(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  ticket_number int not null,
  status text not null default 'en_attente' check (status in ('en_attente', 'en_cours', 'termine', 'absent')),
  queue_date date not null default current_date,
  called_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_queue_tickets_centre_date
  on public.queue_tickets (centre_id, service_id, queue_date, status);

-- ------------------------------------------------------------
-- Codes OTP (générés et vérifiés côté serveur uniquement)
-- ------------------------------------------------------------
create table if not exists public.otp_codes (
  id uuid primary key default uuid_generate_v4(),
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed boolean not null default false,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_otp_codes_phone on public.otp_codes (phone);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.centres enable row level security;
alter table public.services enable row level security;
alter table public.slots enable row level security;
alter table public.appointments enable row level security;
alter table public.queue_tickets enable row level security;
-- otp_codes n'est JAMAIS exposé en lecture/écriture côté client :
-- pas de policy = aucun accès via l'API publique, seules les
-- Edge Functions (clé service_role) y touchent.

-- Centres et services : lecture publique
create policy "centres_public_read" on public.centres for select using (true);
create policy "services_public_read" on public.services for select using (true);
create policy "slots_public_read" on public.slots for select using (true);

-- Profils : chacun voit/modifie le sien
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_self_insert" on public.profiles
  for insert with check (auth.uid() = id);

-- Rendez-vous : le patient voit/gère les siens
create policy "appointments_self_select" on public.appointments
  for select using (auth.uid() = patient_id);
create policy "appointments_self_insert" on public.appointments
  for insert with check (auth.uid() = patient_id);
create policy "appointments_self_update" on public.appointments
  for update using (auth.uid() = patient_id);

-- Tickets de file : le patient voit le sien via son rendez-vous
create policy "queue_tickets_self_select" on public.queue_tickets
  for select using (
    exists (
      select 1 from public.appointments a
      where a.id = queue_tickets.appointment_id
      and a.patient_id = auth.uid()
    )
  );

-- Agents/admins : accès large en lecture sur la file de leur centre
-- (à affiner : ici on autorise tout profil role='agent' à lire toute la file)
create policy "queue_tickets_agent_select" on public.queue_tickets
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('agent', 'admin')
    )
  );
create policy "queue_tickets_agent_update" on public.queue_tickets
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('agent', 'admin')
    )
  );

-- ============================================================
-- Création automatique du ticket de file d'attente
-- Dès qu'un rendez-vous est inséré avec le statut 'confirme', on lui
-- attribue un ticket_number (le suivant disponible pour ce centre/service
-- le jour du rendez-vous).
-- ============================================================
create or replace function public.create_queue_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number int;
begin
  if new.status = 'confirme' then
    select coalesce(max(ticket_number), 0) + 1 into next_number
    from public.queue_tickets
    where centre_id = new.centre_id
      and service_id = new.service_id
      and queue_date = new.scheduled_at::date;

    insert into public.queue_tickets (appointment_id, centre_id, service_id, ticket_number, queue_date)
    values (new.id, new.centre_id, new.service_id, next_number, new.scheduled_at::date);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_create_queue_ticket on public.appointments;
create trigger trg_create_queue_ticket
  after insert on public.appointments
  for each row execute function public.create_queue_ticket();

-- ============================================================
-- Données de démonstration (à supprimer en production)
-- ============================================================
insert into public.centres (name, address, city) values
  ('Centre de Santé de Grand Dakar', 'Avenue Bourguiba', 'Dakar')
on conflict do nothing;
