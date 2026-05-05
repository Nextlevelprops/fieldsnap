# FieldSnap — Setup Guide

## Step 1 — Copy the project to your Desktop

Open Terminal and run:

```bash
cp -r /path/to/fieldsnap ~/Desktop/fieldsnap
cd ~/Desktop/fieldsnap
```

(If you downloaded a zip, unzip it to ~/Desktop/fieldsnap)

---

## Step 2 — Create a new Supabase project

1. Go to https://supabase.com and sign in
2. Click **New Project**
3. Name it **fieldsnap**
4. Choose a strong database password (save it somewhere)
5. Pick the region closest to you (US East if you're in Missouri)
6. Click **Create new project** and wait ~1 minute

---

## Step 3 — Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase_schema.sql` from your project folder
4. Copy ALL of its contents and paste into the SQL Editor
5. Click **Run** (green button)
6. You should see "Success. No rows returned"

---

## Step 4 — Set your account as Owner

After you first sign up in the app, you need to set your role to 'owner':

1. Go to Supabase → **Table Editor** → `profiles`
2. Find your row (it will appear after you sign up)
3. Click on the `role` column and change it from `contractor` to `owner`
4. Click **Save**

---

## Step 5 — Get your Supabase keys

1. In Supabase, go to **Project Settings** → **API**
2. Copy the **Project URL** (looks like `https://abcxyz.supabase.co`)
3. Copy the **anon public** key (long string starting with `eyJ...`)

---

## Step 6 — Create your .env.local file

In Terminal, inside your fieldsnap folder:

```bash
cd ~/Desktop/fieldsnap
cp .env.example .env.local
```

Then open `.env.local` in a text editor and fill in:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your anon key here...
```

---

## Step 7 — Install dependencies and run

```bash
cd ~/Desktop/fieldsnap
npm install
npm run dev
```

Then open your browser to: **http://localhost:3000**

---

## Step 8 — Sign up as the Owner

1. On the app, choose **English**
2. Click **Create Account**
3. Fill in your name, phone, email, password
4. After signing up, go set yourself as owner in Supabase (Step 4)
5. Sign out and sign back in — you'll now see the owner dashboard

---

## Deploy to Vercel (when ready)

Same workflow as your Buyer Locate app:

```bash
cd ~/Desktop/fieldsnap
git init
git add .
git commit -m "Initial FieldSnap build"
```

Then:
1. Create a new GitHub repo at github.com (call it `fieldsnap`)
2. Push to it:
```bash
git remote add origin https://github.com/Nextlevelprops/fieldsnap.git
git push -u origin main
```
3. Go to vercel.com → New Project → Import from GitHub → fieldsnap
4. Add Environment Variables:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Click Deploy

---

## Features Included

- ✅ English / Spanish language selection at signup
- ✅ Owner + Contractor roles
- ✅ Property dashboard (Active / Completed tabs)
- ✅ Property tiles with cover photo and open task count
- ✅ Three-tab task view: Today / Upcoming / Done
- ✅ Overdue tasks highlighted in red
- ✅ Create tasks with photo (camera or gallery) + description
- ✅ Auto-translate task descriptions EN ↔ ES
- ✅ Image annotation tool (lines, circles, arrows, text, 6 colors)
- ✅ Complete tasks with required proof photo
- ✅ Comments with @mention and notifications
- ✅ Realtime comment updates
- ✅ Contractor invite, assign to properties
- ✅ Log work days (full / half day per property)
- ✅ Contractor profile with activity history and schedule
- ✅ Pay rate setting per contractor (daily / hourly / weekly / GC)
- ✅ Notification bell with unread count

---

## Troubleshooting

**"Missing Supabase env vars" error** — Make sure `.env.local` exists and has both values filled in. Restart `npm run dev` after creating it.

**Photos not uploading** — Go to Supabase → Storage and confirm the `fieldsnap-uploads` bucket exists and is set to Public.

**Can't see properties** — Make sure your profile role is set to `owner` in the Supabase profiles table.

**Translation not working** — LibreTranslate is used for free translation. If it's rate-limited, the original text will show without translation. You can replace `src/lib/translate.js` with a Claude API call if you want higher reliability.
