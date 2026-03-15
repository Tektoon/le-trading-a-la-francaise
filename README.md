# 🇫🇷 Le Trading à la Française

Réseau social de trading — analyses, chat temps réel, indicateurs.

---

## ÉTAPE 1 — Supabase : créer les tables

Dans **SQL Editor**, exécute ce SQL en une seule fois :

```sql
-- Profils utilisateurs
create table profiles (
  id           uuid references auth.users primary key,
  username     text unique not null,
  bio          text default '',
  avatar_color text default '#2563eb',
  created_at   timestamptz default now()
);
alter table profiles enable row level security;
create policy "Lecture publique" on profiles for select using (true);
create policy "Modif perso" on profiles for update using (auth.uid() = id);
create policy "Insert perso" on profiles for insert with check (auth.uid() = id);

-- Analyses / posts
create table analyses (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users not null,
  title       text not null,
  body        text not null,
  instrument  text,
  timeframe   text,
  direction   text,
  image_url   text,
  pine_script text,
  created_at  timestamptz default now()
);
alter table analyses enable row level security;
create policy "Lecture publique" on analyses for select using (true);
create policy "Insert perso"     on analyses for insert with check (auth.uid() = user_id);
create policy "Delete perso"     on analyses for delete using (auth.uid() = user_id);

-- Likes
create table likes (
  id      bigint generated always as identity primary key,
  post_id bigint references analyses on delete cascade,
  user_id uuid references auth.users,
  unique(post_id, user_id)
);
alter table likes enable row level security;
create policy "Lecture publique" on likes for select using (true);
create policy "Insert perso"     on likes for insert with check (auth.uid() = user_id);
create policy "Delete perso"     on likes for delete using (auth.uid() = user_id);

-- Messages chat
create table messages (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users not null,
  room       text not null default 'general',
  content    text not null,
  created_at timestamptz default now()
);
alter table messages enable row level security;
create policy "Lecture publique" on messages for select using (true);
create policy "Insert perso"     on messages for insert with check (auth.uid() = user_id);

-- Indicateurs
create table indicators (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users not null,
  name        text not null,
  description text not null,
  type        text default 'Pine Script',
  pine_script text,
  image_url   text,
  file_url    text,
  created_at  timestamptz default now()
);
alter table indicators enable row level security;
create policy "Lecture publique" on indicators for select using (true);
create policy "Insert perso"     on indicators for insert with check (auth.uid() = user_id);
create policy "Delete perso"     on indicators for delete using (auth.uid() = user_id);
```

---

## ÉTAPE 2 — Activer le Realtime

Dans Supabase → **Database → Replication** → active la table **messages**.

---

## ÉTAPE 3 — Configurer les clés

Ouvre `src/supabase.js` et remplace :
- `COLLE_TON_PROJECT_URL_ICI` → ton Project URL
- `COLLE_TA_CLE_ANON_ICI` → ta clé anon/public

---

## ÉTAPE 4 — Déployer

```bash
git init && git add . && git commit -m "init ltaf"
git remote add origin https://github.com/TON_USERNAME/le-trading-a-la-francaise.git
git push -u origin master
```

Puis Vercel → Add New Project → Deploy.

---

## Développement local

```bash
npm install
npm run dev
```
