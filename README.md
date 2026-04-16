# Workout Tracker

A production-quality workout tracking and analytics platform built with React, Express, and PostgreSQL. Users can log workouts, create reusable routines, track exercise progress with personal records, view workouts on a calendar, and analyze performance through charts and streaks.

---

## Current Status

### What's Been Built (Backend — complete)

The entire backend API is implemented and type-checks cleanly. The frontend is scaffolded but has no pages yet.

### What Still Needs To Be Built (Frontend — not started)

All frontend pages, components, API hooks, and UI need to be implemented. See [Remaining Work](#remaining-work) below for the detailed task list.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (access token in memory + refresh token in httpOnly cookie), bcrypt (12 rounds) |
| Charts | Recharts (not yet used — frontend not built) |
| Forms | React Hook Form + Zod (not yet used — frontend not built) |
| Routing | React Router v6 (not yet used — frontend not built) |
| Server State | React Query v5 (not yet used — frontend not built) |
| Build | Vite (client), tsx (server dev) |

## Architecture

**Monorepo with npm workspaces** — three packages:

```
workout-app/
├── shared/    → TypeScript types shared between client and server
├── server/    → Express REST API with Prisma ORM
└── client/    → React SPA with Vite (scaffolded, no pages yet)
```

**Backend layered architecture:** `routes → controllers → services → Prisma`
- **Routes** define endpoints and attach validation middleware (Zod schemas)
- **Controllers** handle request/response parsing, call services
- **Services** contain all business logic and database queries
- **Prisma** handles database access via a singleton client

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

## File Structure (What Exists Now)

```
workout-app/
├── package.json                          # npm workspaces root
├── tsconfig.base.json                    # Shared TypeScript config
├── .env.example                          # Environment variable template
├── .gitignore
│
├── shared/                               # ✅ COMPLETE
│   ├── package.json
│   ├── tsconfig.json
│   └── src/types/
│       ├── index.ts                      # Re-exports all types
│       ├── api.ts                        # PaginatedResponse<T>, ApiError
│       ├── auth.ts                       # LoginRequest, RegisterRequest, AuthResponse, JwtPayload
│       ├── user.ts                       # User, UpdateProfileRequest, ChangePasswordRequest
│       ├── exercise.ts                   # Exercise, CreateExerciseRequest, ExerciseHistory, PersonalRecord, MuscleGroup, Equipment
│       ├── workout.ts                    # Workout, WorkoutExercise, WorkoutSet, WorkoutSummary, CreateWorkoutRequest, CalendarDay
│       ├── routine.ts                    # Routine, RoutineExercise, CreateRoutineRequest
│       ├── analytics.ts                  # AnalyticsSummary, StreakData, VolumeDataPoint, MuscleGroupData, FrequencyDataPoint
│       ├── goal.ts                       # Goal, CreateGoalRequest
│       └── bodyweight.ts                 # BodyweightLog, CreateBodyweightRequest
│
├── server/                               # ✅ COMPLETE (all endpoints implemented, type-checks clean)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                              # Local env (not committed — copy from .env.example)
│   ├── prisma/
│   │   ├── schema.prisma                 # 10 tables, enums, indexes, cascade rules
│   │   └── seed.ts                       # 80+ exercises, demo user + 20 workouts + routines + bodyweight + goals
│   └── src/
│       ├── index.ts                      # Entry point — starts Express on PORT
│       ├── app.ts                        # Express app: CORS, cookie-parser, JSON, route mounting, error handler
│       ├── config/env.ts                 # Zod validation of DATABASE_URL, JWT secrets, PORT, NODE_ENV
│       ├── middleware/
│       │   ├── auth.ts                   # JWT Bearer token verification, attaches userId to req
│       │   ├── validate.ts               # Zod request body validation middleware factory
│       │   └── errorHandler.ts           # Global error handler + AppError class
│       ├── routes/                       # 8 route files mapping HTTP methods to controllers
│       ├── controllers/                  # 8 controller files handling req/res
│       ├── services/                     # 8 service files with all business logic
│       └── utils/
│           ├── prisma.ts                 # Prisma client singleton
│           ├── jwt.ts                    # generateAccessToken, generateRefreshToken, verify functions
│           └── calculations.ts           # calculateEstimated1RM (Epley), calculateVolume
│
├── client/                               # ⚠️ SCAFFOLDED ONLY — no pages or components yet
│   ├── package.json                      # React, Vite, Tailwind, React Query, Recharts, React Router, etc.
│   ├── tsconfig.json
│   ├── vite.config.ts                    # Proxies /api to localhost:3001
│   ├── tailwind.config.ts                # Dark mode: class strategy
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx                      # Placeholder — just renders "Workout Tracker" heading
│       └── index.css                     # Tailwind directives
│
└── docs/superpowers/
    ├── specs/2026-04-15-workout-app-design.md    # Full design spec
    └── plans/2026-04-15-workout-app-implementation.md  # 13-task implementation plan
```

---

## Remaining Work

The implementation plan (`docs/superpowers/plans/2026-04-15-workout-app-implementation.md`) has 13 tasks. Tasks 1–7 are done. Here's what's left:

### Task 8: Frontend Foundation — Auth, Layout, Routing
- [ ] **Axios client** (`client/src/api/client.ts`) — instance with `/api` base, request interceptor to attach Bearer token, response interceptor to auto-refresh on 401 (queues concurrent requests during refresh)
- [ ] **Auth API** (`client/src/api/auth.ts`) — login, register, refresh, logout functions
- [ ] **AuthContext** (`client/src/context/AuthContext.tsx`) — provides user, accessToken (in state), login/register/logout. On mount, attempts refresh to restore session. Shows loading spinner until initial auth check completes
- [ ] **ThemeContext** (`client/src/context/ThemeContext.tsx`) — reads system preference via matchMedia, applies `dark` class to `<html>`, supports light/dark/system toggle, persists to user profile
- [ ] **AppLayout** (`client/src/components/layout/AppLayout.tsx`) — sidebar on desktop (lg:), bottom nav on mobile, main content area with padding
- [ ] **Sidebar** (`client/src/components/layout/Sidebar.tsx`) — fixed left nav: Dashboard, Workouts, Routines, Calendar, Analytics, Profile. Highlights active route
- [ ] **BottomNav** (`client/src/components/layout/BottomNav.tsx`) — fixed bottom bar: Dashboard, Workouts, + (new), Calendar, Profile
- [ ] **Login page** (`client/src/pages/Login.tsx`) — email + password form, React Hook Form + Zod, redirects to dashboard
- [ ] **Register page** (`client/src/pages/Register.tsx`) — name + email + password + confirm password
- [ ] **App.tsx** — React Router with all routes, QueryClientProvider + AuthProvider + ThemeProvider, ProtectedRoute wrapper

### Task 9: Dashboard, Workouts, Routines Pages
- [ ] **Shared UI components** — StatCard, Modal, ConfirmDialog, Toast, EmptyState, LoadingSpinner, PageHeader
- [ ] **API hooks** — React Query hooks for workouts, routines, exercises, analytics, goals, bodyweight (all in `client/src/api/*.ts`)
- [ ] **Dashboard** — stat cards (workouts this week, streak, volume, avg duration), recent workout card, mini volume chart, goal progress bars, quick-start buttons for favorite routines
- [ ] **Workout History** — search input + tag filter pills, paginated WorkoutCard list (name, date, exercises, duration, volume, PR badges)
- [ ] **Workout Detail** — full workout view with exercises + sets table, edit/delete buttons
- [ ] **Routines** — routine cards with tag filter, "New Routine" button, favorite star, "Start" button
- [ ] **Routine Form** — add exercises via ExercisePicker modal (search + muscle group filter), set default sets/reps/weight per exercise
- [ ] **ExercisePicker** — modal with search + muscle group tabs, lists matching exercises

### Task 10: Active Workout Logging
- [ ] **useTimer hook** — countdown timer with audio beep on completion
- [ ] **SetRow** — weight input, reps input, RPE dropdown, warmup toggle, completion checkbox. Shows previous performance
- [ ] **ExerciseEntry** — exercise name + previous best, list of SetRows, "Add Set" button, notes
- [ ] **RestTimer** — circular countdown, configurable duration (30/60/90/120s), audio alert
- [ ] **ActiveWorkout page** — workout name, running duration timer, exercise entries, "Add Exercise" button, rest timer, "Finish Workout" button. Can start blank or from a routine (via location state from routines/:id/start)

### Task 11: Calendar + Analytics Pages
- [ ] **CalendarDay** — blue dot for workout days, green for today, click handler
- [ ] **Calendar** — month grid, prev/next navigation, fetches calendar data, shows workout summary on day click
- [ ] **VolumeChart** — Recharts BarChart, weekly volume over 12 weeks
- [ ] **ProgressChart** — Recharts LineChart, max weight over time for selected exercise
- [ ] **MuscleGroupPie** — Recharts PieChart with labels/percentages
- [ ] **Analytics page** — stat cards row, streak badge, volume chart, muscle group pie + recent PRs, frequency chart, exercise progress section

### Task 12: Profile, Goals, Dark Mode, Polish
- [ ] **Profile page** — edit name, unit preference toggle, theme selector, change password, bodyweight log section, goals section, logout button
- [ ] **GoalProgress** — progress bar with label, color changes with progress
- [ ] **Dark mode** — ensure all components have `dark:` variants, test light/dark/system
- [ ] **Responsive polish** — test 375px/768px/1280px, fix layout issues

### Task 13: Final Polish
- [ ] Expand seed data if needed
- [ ] Final README update with screenshots

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
Access tokens are short-lived (15 min) and stored in JavaScript memory — never localStorage. Refresh tokens live in httpOnly cookies (7 day TTL). The frontend Axios interceptor will catch 401s, call `/api/auth/refresh`, and retry the original request transparently.

### Streak Calculation
Streaks are computed from workout dates. A "current streak" counts consecutive days backward from today (or yesterday, to allow for rest days not breaking the streak). The "longest streak" tracks the best-ever run.
