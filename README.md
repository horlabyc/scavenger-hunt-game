# 🧭 Scavenger Hunt Manager

A small, mobile-friendly web app to run a 1-hour retreat scavenger hunt.

- Players enter a **personal code** to join their group and see their teammates.
- Each group has one **team lead** (the only person who can mark tasks done); members are view-only.
- Everyone sees live **progress %**, **score**, and a **1-hour countdown**.
- An **organizer/admin** starts and stops the game and watches a live **leaderboard**.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS** and a tiny **MongoDB** for shared state. Deploys to **Vercel**.

---

## 1. Edit your content

All game content lives in one file: **`lib/config.ts`**.

- Replace the **sample groups** with your real groups, leads, and members.
- Give **every person a unique code** (leads and members). Codes are case-insensitive.
- Replace the **`TASKS`** list and set the **score** for each task.

The admin password is **not** in this file — it's an environment variable (see below).

## 2. Set up MongoDB (free)

1. Create a free cluster at <https://www.mongodb.com/atlas> (M0 tier is fine).
2. Add a database user and allow network access (`0.0.0.0/0` for simplicity).
3. Copy the connection string (`mongodb+srv://...`).

No schema/setup needed — collections are created automatically on first write.

## 3. Run locally

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev                  # http://localhost:3000
```

`.env.local`:

```
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=scavenger_hunt
ADMIN_PASSWORD=your-secret-password
```

- Players: open `/` and enter a code (e.g. a sample `TEAM-101` or `LEAD-001`).
- Organizer: open `/admin` and enter `ADMIN_PASSWORD`.

## 4. Deploy to Vercel

1. Push this folder to a Git repository (GitHub/GitLab/Bitbucket).
2. Import the repo at <https://vercel.com/new>.
3. Add the three environment variables (`MONGODB_URI`, `MONGODB_DB`, `ADMIN_PASSWORD`)
   in **Project → Settings → Environment Variables**.
4. Deploy. Share the URL with players; keep `/admin` for yourself.

---

## How it works

- **No accounts / sessions** — codes are validated server-side on every action (fine for a game).
- The DB stores only **game status** and **per-group completed task IDs**. Scores and
  percentages are always *derived* from those, so they can't drift.
- Screens **poll every 4 seconds**, so starting/stopping the game and a lead's task updates
  show up on everyone's screen within a few seconds.

## Routes

| Path     | Who      | What                                            |
| -------- | -------- | ----------------------------------------------- |
| `/`      | Players  | Enter code to join                              |
| `/team`  | Players  | Teammates, tasks, progress, countdown           |
| `/admin` | Organizer| Start/stop game + live leaderboard              |
