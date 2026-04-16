# Workout Tracker

A production-quality workout tracking and analytics platform built with React, Express, and PostgreSQL. Users can log workouts, create reusable routines, track exercise progress with personal records, view workouts on a calendar, and analyze performance through charts and streaks.

---

## Current Status

### What's Been Built

**Backend — 100% complete.** All 30+ endpoints implemented, type-checks clean. See [API Endpoints](#api-endpoints) below.

**Frontend — code complete.** All pages implemented, everything type-checks clean, production `vite build` succeeds. End-to-end browser smoke test against a live database is still pending.

### Task Progress

| Task | Status | Notes |
|------|--------|-------|
| 1. Monorepo scaffolding | ✅ Done | |
| 2. Shared types | ✅ Done | |
| 3. Prisma schema + server foundation | ✅ Done | |
| 4. Auth system (backend) | ✅ Done | |
| 5. User/Exercise/Routine/Workout CRUD (backend) | ✅ Done | |
| 6. Bodyweight/Goals/Analytics (backend) | ✅ Done | |
| 7. Exercise seed data | ✅ Done | |
| 8. Frontend foundation (auth, layout, routing) | ✅ Done | |
| 9. Dashboard, Workouts, Routines pages | ✅ Done | |
| 10. Active workout logging | ✅ Done | |
| 11. Calendar + Analytics pages | ✅ Done | |
| 12. Profile, Goals, Dark mode polish | ✅ Done | Profile page with preferences, password, bodyweight, goals |
| 13. Final polish | 🟡 Partial | Live browser smoke test pending |

### What Still Needs To Be Done

**End-to-end smoke test** — run `npm run dev` against a local Postgres, then manually walk through: register → create routine → start workout → log sets → finish → view detail → view on calendar → view analytics → profile settings (edit name, toggle units, change theme, log bodyweight, create goal). The seed script ships a demo account (`demo@workout.app` / `password123`) with ~20 workouts for populating the charts.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (access token in memory + refresh token in httpOnly cookie), bcrypt (12 rounds) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 |
| Server State | React Query v5 |
| Build | Vite (client), tsx (server dev) |

## Architecture

**Monorepo with npm workspaces** — three packages:

```
workout-app/
├── shared/    → TypeScript types shared between client and server
├── server/    → Express REST API with Prisma ORM
└── client/    → React SPA with Vite
```

**Backend layered architecture:** `routes → controllers → services → Prisma`
- **Routes** define endpoints and attach validation middleware (Zod schemas)
- **Controllers** handle request/response parsing, call services
- **Services** contain all business logic and database queries
- **Prisma** handles database access via a singleton client

**Frontend architecture:**
- **Contexts** (`AuthContext`, `ThemeContext`, `ToastProvider`) — global state
- **React Query hooks** — server state, keyed cache, auto-invalidation on mutations
- **Axios client** with interceptors — auto-attaches Bearer token, auto-refreshes on 401, queues concurrent requests during refresh
- **Layered components:** `pages/` → `components/features/` → `components/ui/`

---

## Database Schema (10 tables)

All tables use UUID primary keys and have `created_at`/`updated_at` timestamps.

| Table | Purpose | Key Details |
|-------|---------|-------------|
| `users` | User accounts | email (unique), password hash, unit preference (kg/lb), theme (light/dark/system) |
| `exercises` | Exercise catalog | Hybrid: `user_id = NULL` → system exercise, non-null → user's custom exercise. Has muscle_group, secondary_muscles[], equipment |
| `routines` | Reusable workout templates | Belongs to user. Has tags[], is_favorite, last_used_at |
| `routine_exercises` | Exercises within a routine | Links routine ↔ exercise with default_sets, default_reps, default_weight, rest_seconds |
| `workouts` | Completed workouts | Belongs to user, optionally links to originating routine. Has date, duration, notes, tags[] |
| `workout_exercises` | Exercises within a workout | Links workout ↔ exercise with sort_order and notes |
| `workout_sets` | Individual sets | Belongs to workout_exercise. Has weight, reps, rpe (1-10), is_warmup, is_pr flags |
| `personal_records` | Denormalized PR tracking | Tracks max_weight, max_reps, max_volume, est_1rm per user+exercise. Auto-updated on workout save |
| `bodyweight_logs` | Bodyweight tracking | One entry per user per date (upsert). Weight + optional notes |
| `goals` | User goals | Two types: `workouts_per_week` (target count) and `exercise_target` (target weight on an exercise) |

**Key indexes:**
- `workouts(user_id, date)` — calendar queries
- `personal_records(user_id, exercise_id, record_type)` — PR lookups
- `bodyweight_logs(user_id, date)` — unique constraint

**Cascade behavior:**
- Deleting a user cascades to all their data
- Deleting a workout cascades to its exercises and sets
- Deleting a routine cascades to its routine_exercises
- Deleting a workout that had PR sets → personal_record.workout_set_id set to NULL (record preserved)

---

## API Endpoints (30+ endpoints)

All endpoints prefixed with `/api`. All except auth require `Authorization: Bearer <access_token>`.

### Auth (`/api/auth`)
| Method | Endpoint | What It Does |
|--------|----------|-------------|
| POST | `/register` | Creates user, hashes password (bcrypt 12 rounds), returns access token + sets refresh cookie |
| POST | `/login` | Validates credentials, returns access token + sets refresh cookie |
| POST | `/refresh` | Reads refresh token from httpOnly cookie, returns new access token |
| POST | `/logout` | Clears refresh cookie |

**Token strategy:**
- Access token: JWT, 15-minute TTL, stored in memory (not localStorage)
- Refresh token: JWT, 7-day TTL, httpOnly secure cookie
- Access token payload: `{ userId, email }`

### Users (`/api/users`)
| Method | Endpoint | What It Does |
|--------|----------|-------------|
| GET | `/me` | Returns current user profile |
| PUT | `/me` | Updates name, unitPreference, theme |
| PUT | `/me/password` | Changes password (requires current password) |

### Exercises (`/api/exercises`)
| Method | Endpoint | What It Does |
|--------|----------|-------------|
| GET | `/` | Lists all system exercises + user's custom exercises. Optional `?muscleGroup=` filter |
| POST | `/` | Creates a custom exercise (sets is_custom=true, userId=current user) |
| PUT | `/:id` | Updates a custom exercise (403 if trying to modify system exercise) |
| DELETE | `/:id` | Deletes a custom exercise (403 if system) |
| GET | `/:id/history` | Paginated set history for an exercise across all workouts |
| GET | `/:id/records` | All PRs for a specific exercise |

### Records (`/api/records`)
| Method | Endpoint | What It Does |
|--------|----------|-------------|
| GET | `/` | All PRs across all exercises for the current user |

### Routines (`/api/routines`)
| Method | Endpoint | What It Does |
|--------|----------|-------------|
| GET | `/` | Lists user's routines (favorites first, then by last updated) |
| GET | `/:id` | Returns routine with all its exercises (including exercise names) |
| POST | `/` | Creates routine + routine_exercises in one transaction |
| PUT | `/:id` | Replaces routine (deletes old exercises, creates new ones) |
| DELETE | `/:id` | Deletes routine (cascades to routine_exercises) |
| POST | `/:id/duplicate` | Copies routine + exercises with name "[name] (copy)" |
| PATCH | `/:id/favorite` | Toggles is_favorite |
| POST | `/:id/start` | Creates a new workout pre-populated with the routine's exercises and default sets/reps/weight. Updates routine's last_used_at |

### Workouts (`/api/workouts`)
| Method | Endpoint | What It Does |
|--------|----------|-------------|
| GET | `/` | Paginated list with filters: `?search=`, `?tags=push,pull`, `?startDate=`, `?endDate=`. Returns summary (exerciseCount, totalVolume, hasPr) |
| GET | `/:id` | Full workout with exercises + sets + exercise names |
| POST | `/` | Creates workout + exercises + sets in one transaction. **Runs PR detection** on every non-warmup set |
| PUT | `/:id` | Replaces workout exercises/sets |
| DELETE | `/:id` | Deletes workout (cascades to exercises and sets) |
| GET | `/calendar/:year/:month` | Returns dates that have workouts with workout count per day |

**PR Detection Logic (in `workout.service.ts`):**
When a workout is saved, for each non-warmup set, the system checks:
1. `max_weight` — is this the heaviest weight for this exercise?
2. `max_reps` — is this the most reps for this exercise?
3. `max_volume` — is `weight × reps` the highest for this exercise?
4. `est_1rm` — is the Epley estimated 1RM (`weight × (1 + reps/30)`) the highest?

If any record is beaten, the `personal_records` table is upserted and the set's `is_pr` flag is set to true.

### Bodyweight (`/api/bodyweight`)
| Method | Endpoint | What It Does |
|--------|----------|-------------|
| GET | `/` | Lists bodyweight logs. Optional `?startDate=`, `?endDate=` |
| POST | `/` | Logs bodyweight (upserts — same user+date replaces existing) |
| DELETE | `/:id` | Deletes a log entry |

### Goals (`/api/goals`)
| Method | Endpoint | What It Does |
|--------|----------|-------------|
| GET | `/` | Lists active goals with **computed currentProgress**. For `workouts_per_week`: counts workouts since Sunday. For `exercise_target`: gets max_weight PR for that exercise |
| POST | `/` | Creates a goal |
| PUT | `/:id` | Updates goal (targetValue, isActive) |
| DELETE | `/:id` | Deletes a goal |

### Analytics (`/api/analytics`)
| Method | Endpoint | What It Does |
|--------|----------|-------------|
| GET | `/summary` | Workouts this week/month, total volume this week/month, avg duration, most recent workout |
| GET | `/streaks` | Current consecutive day streak + longest ever streak |
| GET | `/volume` | Volume per day over last N weeks (default 12). Returns `{ date, volume }[]` for charting |
| GET | `/muscle-groups` | Count + percentage of workout exercises by muscle group |
| GET | `/frequency` | Workouts per week over last N weeks. Returns `{ week, count }[]` for charting |

---

## File Structure

```
workout-app/
├── package.json                              # npm workspaces root
├── tsconfig.base.json                        # Shared TypeScript config
├── .env.example                              # Environment variable template
├── .gitignore
│
├── shared/                                   # ✅ COMPLETE
│   ├── package.json
│   ├── tsconfig.json
│   └── src/types/                            # All shared TypeScript interfaces
│       ├── index.ts                          # Re-exports
│       ├── api.ts, auth.ts, user.ts, exercise.ts,
│       ├── workout.ts, routine.ts, analytics.ts,
│       └── goal.ts, bodyweight.ts
│
├── server/                                   # ✅ COMPLETE
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                                  # Local env (not committed)
│   ├── prisma/
│   │   ├── schema.prisma                     # 10 tables, enums, indexes, cascade rules
│   │   └── seed.ts                           # 80+ exercises, demo user + workouts + routines
│   └── src/
│       ├── index.ts, app.ts
│       ├── config/env.ts                     # Zod-validated env
│       ├── middleware/                       # auth, validate, errorHandler
│       ├── routes/                           # 8 route files
│       ├── controllers/                      # 8 controller files
│       ├── services/                         # 8 service files
│       └── utils/                            # prisma, jwt, calculations
│
├── client/                                   # 🟡 IN PROGRESS (~85%)
│   ├── package.json                          # All deps installed (React, Vite, Tailwind, RQ, Recharts, RR, RHF, Zod)
│   ├── tsconfig.json, vite.config.ts, tailwind.config.ts, postcss.config.js, index.html
│   └── src/
│       ├── main.tsx                          # ✅ Mounts <App />
│       ├── App.tsx                           # ✅ QueryClient + Auth + Theme + Toast providers + Router with Protected/Public routes
│       ├── index.css                         # ✅ Tailwind directives
│       │
│       ├── api/                              # ✅ ALL DONE
│       │   ├── client.ts                     # Axios + interceptors (refresh + retry + queue)
│       │   ├── auth.ts                       # login, register, refresh, logout
│       │   ├── users.ts                      # useUpdateProfile, useChangePassword
│       │   ├── workouts.ts                   # useWorkouts, useWorkout, useCreate/Update/DeleteWorkout, useCalendarData
│       │   ├── routines.ts                   # useRoutines, useRoutine, CRUD, useDuplicate, useToggleFavorite, useStartWorkout
│       │   ├── exercises.ts                  # useExercises, useCreateExercise, useExerciseHistory, useExerciseRecords, useAllRecords
│       │   ├── analytics.ts                  # useSummary, useStreaks, useVolume, useMuscleGroups, useFrequency
│       │   ├── goals.ts                      # useGoals, useCreate/Update/DeleteGoal
│       │   └── bodyweight.ts                 # useBodyweightLogs, useLogBodyweight, useDeleteBodyweight
│       │
│       ├── context/                          # ✅ DONE
│       │   ├── AuthContext.tsx               # user state, login/register/logout, on-mount refresh-to-restore-session
│       │   └── ThemeContext.tsx              # light/dark/system + matchMedia + persists via PUT /users/me
│       │
│       ├── hooks/                            # ✅ DONE
│       │   ├── useAuth.ts
│       │   ├── useTheme.ts
│       │   └── useTimer.ts                   # useTimer (countdown + beep) + useElapsedTimer
│       │
│       ├── utils/                            # ✅ DONE
│       │   ├── formatting.ts                 # formatWeight, formatDate, formatDuration, formatDurationTimer, formatRelativeDate
│       │   └── calculations.ts               # calculateEstimated1RM (Epley), calculateVolume
│       │
│       ├── components/
│       │   ├── layout/                       # ✅ DONE
│       │   │   ├── AppLayout.tsx             # Sidebar (lg+) + BottomNav (mobile) + <Outlet>
│       │   │   ├── Sidebar.tsx               # 6 nav items with SVG icons, active state via NavLink
│       │   │   └── BottomNav.tsx             # 5 items (Home, Workouts, +, Calendar, Profile) with floating + button
│       │   ├── ui/                           # ✅ DONE
│       │   │   ├── LoadingSpinner.tsx        # sm/md/lg
│       │   │   ├── PageHeader.tsx            # Accepts ReactNode title + optional action
│       │   │   ├── StatCard.tsx              # label, value, icon, subtext
│       │   │   ├── Modal.tsx                 # ESC closes, click outside closes
│       │   │   ├── ConfirmDialog.tsx         # Wraps Modal with danger variant
│       │   │   ├── Toast.tsx                 # ToastProvider + useToast hook, auto-dismiss after 3s
│       │   │   └── EmptyState.tsx            # Centered icon + title + description + action
│       │   └── features/                     # ✅ DONE
│       │       ├── PRBadge.tsx               # Star icon + "PR" label, xs/sm/md
│       │       ├── StreakBadge.tsx           # 🔥 + days count
│       │       ├── WorkoutCard.tsx           # Used on WorkoutHistory
│       │       ├── RoutineCard.tsx           # Used on Routines (star fav + Start button)
│       │       ├── ExercisePicker.tsx        # Modal with search + muscle filter + custom exercise inline form
│       │       ├── SetRow.tsx                # Weight/reps/RPE/warmup/complete/remove
│       │       ├── ExerciseEntry.tsx         # Exercise header + SetRow list + previous-best from history
│       │       ├── RestTimer.tsx             # Circular SVG countdown + presets (30/60/90/120/180s)
│       │       ├── Calendar.tsx              # Monthly grid, prev/next nav, fetches calendar data
│       │       ├── CalendarDay.tsx           # Blue dot for workout days, green for today
│       │       ├── VolumeChart.tsx           # Recharts BarChart
│       │       ├── ProgressChart.tsx         # Recharts LineChart (max weight over time for an exercise)
│       │       ├── MuscleGroupPie.tsx        # Recharts PieChart with % labels
│       │       └── FrequencyChart.tsx        # Recharts BarChart (workouts/week)
│       │
│       └── pages/
│           ├── Login.tsx                     # ✅ DONE (RHF + Zod)
│           ├── Register.tsx                  # ✅ DONE (RHF + Zod, confirm-password match)
│           ├── Dashboard.tsx                 # ✅ DONE (4 StatCards + volume chart + goals + recent workout + favorites + streak badge)
│           ├── WorkoutHistory.tsx            # ✅ DONE (search + paginated WorkoutCards)
│           ├── WorkoutDetail.tsx             # ✅ DONE (stats + exercises table + delete confirm)
│           ├── ActiveWorkout.tsx             # ✅ DONE (elapsed timer + ExerciseEntries + rest timer + finish)
│           ├── Routines.tsx                  # ✅ DONE (grid of RoutineCards)
│           ├── RoutineFormPage.tsx           # ✅ DONE (name/tags/exercises with up/down reorder + ExercisePicker)
│           ├── CalendarPage.tsx              # ✅ DONE (Calendar + selected-day workouts list)
│           ├── Analytics.tsx                 # ⬜ STUB — needs to wire up already-built chart components
│           ├── Profile.tsx                   # ⬜ MINIMAL STUB — just email + logout, needs full settings page
│           └── NotFound.tsx                  # ✅ DONE
│
└── docs/superpowers/
    ├── specs/2026-04-15-workout-app-design.md          # Full design spec
    └── plans/2026-04-15-workout-app-implementation.md  # 13-task implementation plan
```

---

## Remaining Work (When You Resume)

### Task 13: Final Polish — End-to-end smoke test

1. Run `npm run dev` against a local Postgres + seeded database and walk through the full flow:
   - Register → dashboard loads empty
   - Create routine → start workout from it → log sets → finish
   - Workout appears on WorkoutHistory + Calendar + Dashboard
   - Analytics shows populated charts (volume, muscle groups, frequency, PRs)
   - Profile: edit name, toggle kg/lb, change theme, change password, log bodyweight, create/delete a goal
2. Fix any bugs found.
3. The seed data has a demo user (`demo@workout.app` / `password123`) with 20+ workouts for testing against populated analytics.

### Notes for Continuation

- **Type-check** before committing: `cd client && npx tsc --noEmit` and `cd server && npx tsc --noEmit`. Both currently exit clean.
- **Production build:** `npx vite build` in `client/` completes successfully (~2.5s).
- **Tests:** the plan doesn't include automated tests. Smoke testing in the browser is the acceptance criterion.
- **Branch:** working on `main`. All commits are on main.

---

## How To Run Locally

### Prerequisites
- Node.js 18+
- PostgreSQL running locally
- A database created (e.g., `workout_app`)

### Setup

```bash
# Clone and install
git clone <repo-url>
cd workout-app
npm install

# Configure environment
cp .env.example server/.env
# Edit server/.env with your DATABASE_URL and JWT secrets

# Run database migration
npm run db:migrate -w server

# Seed exercise catalog + demo data
npm run db:seed -w server

# Start both servers
npm run dev
# → Server: http://localhost:3001
# → Client: http://localhost:5173 (proxies /api to server)
```

### Demo Account
After seeding: `demo@workout.app` / `password123`

### Available Scripts

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Starts both server (tsx watch) and client (Vite) concurrently |
| `npm run dev:server` | Starts only the server |
| `npm run dev:client` | Starts only the client |
| `npm run db:migrate` | Runs Prisma migrations |
| `npm run db:seed` | Seeds exercises + demo data |
| `npm run db:reset` | Resets database and re-runs migrations |
| `npm run build` | Builds shared, server, and client for production |

---

## Design Documents

- **Full Design Spec:** `docs/superpowers/specs/2026-04-15-workout-app-design.md` — database schema, API design, frontend pages, component architecture, auth flow, tech decisions
- **Implementation Plan:** `docs/superpowers/plans/2026-04-15-workout-app-implementation.md` — 13 tasks broken into steps with code examples

---

## Key Implementation Details

### PR Detection
When a workout is created/updated, the system automatically checks every non-warmup set against the user's `personal_records` table. Four record types are tracked per exercise: max weight, max reps, max volume (weight × reps), and estimated 1RM (Epley formula: `weight × (1 + reps/30)`). If a record is beaten, the PR table is upserted and the set is flagged with `is_pr = true`.

### Exercise Catalog
Hybrid approach — the database is seeded with ~80 system exercises (`user_id = NULL`) covering chest, back, shoulders, legs, arms, core, and cardio. Users can also create custom exercises that only they can see. System exercises cannot be edited or deleted.

### Auth Token Strategy
Access tokens are short-lived (15 min) and stored in JavaScript memory — never localStorage. Refresh tokens live in httpOnly cookies (7 day TTL). The frontend Axios interceptor catches 401s, calls `/api/auth/refresh`, and retries the original request transparently. Concurrent requests during a refresh are queued and all get the new token.

### Streak Calculation
Streaks are computed from workout dates. A "current streak" counts consecutive days backward from today (or yesterday, to allow for rest days not breaking the streak). The "longest streak" tracks the best-ever run.

### Active Workout Flow
`ActiveWorkout.tsx` supports two entry modes:
1. **Blank** — user navigates to `/workouts/active` with no state; name defaults to `Workout {date}`.
2. **From routine** — `RoutineCard` "Start" button calls `POST /api/routines/:id/start` and navigates with `state: { routine }`. The page pre-populates with the routine's exercises, default sets/reps/weight. `rest_seconds` from the routine triggers the `RestTimer` when a set is marked complete.

The elapsed duration uses `useElapsedTimer()` and is sent as `durationMinutes` when finishing. Only sets with at least one of `weight` or `reps` filled in are saved.
