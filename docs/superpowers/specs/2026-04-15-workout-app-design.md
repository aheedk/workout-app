# Workout Tracking Application — Design Spec

## Overview

A production-quality workout tracking and analytics platform where users log workouts, create reusable routines, track exercise progress with personal records, view workouts on a calendar, and analyze performance through charts and streaks. Similar in scope to apps like Strong or Fitbod, focused on lifting/resistance training.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens), bcrypt |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 |
| State | React Query (server state) + React Context (auth, theme) |
| Build | Vite (client), tsx (server dev) |

## Architecture

Monorepo with npm workspaces:

```
workout-app/
├── shared/       # TypeScript types shared between client and server
├── server/       # Express API with Prisma
└── client/       # React SPA with Vite
```

Backend follows a layered architecture: **routes → controllers → services → Prisma**. Each layer has a single responsibility — routes define endpoints and attach middleware, controllers handle request/response parsing, services contain business logic, and Prisma handles database access.

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE |
| password_hash | VARCHAR(255) | bcrypt |
| name | VARCHAR(100) | |
| avatar_url | TEXT | nullable |
| unit_preference | ENUM(kg, lb) | default: lb |
| theme | ENUM(light, dark, system) | default: system |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### exercises
Hybrid library: rows with `user_id = NULL` are system-seeded exercises; non-null are user-created custom exercises.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users, nullable (null = system) |
| name | VARCHAR(100) | |
| muscle_group | VARCHAR(50) | primary muscle group |
| secondary_muscles | TEXT[] | PostgreSQL array |
| equipment | VARCHAR(50) | nullable |
| is_custom | BOOLEAN | default: false |
| created_at | TIMESTAMP | |

### routines
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| name | VARCHAR(100) | |
| tags | TEXT[] | push/pull/legs/upper/lower/cardio |
| is_favorite | BOOLEAN | default: false |
| last_used_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### routine_exercises
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| routine_id | UUID | FK → routines (CASCADE) |
| exercise_id | UUID | FK → exercises |
| sort_order | INTEGER | |
| default_sets | INTEGER | default: 3 |
| default_reps | INTEGER | default: 10 |
| default_weight | DECIMAL | nullable |
| rest_seconds | INTEGER | default: 90 |

### workouts
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| routine_id | UUID | FK → routines, nullable |
| name | VARCHAR(100) | |
| date | DATE | |
| started_at | TIMESTAMP | |
| completed_at | TIMESTAMP | nullable |
| duration_minutes | INTEGER | nullable |
| notes | TEXT | nullable |
| tags | TEXT[] | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### workout_exercises
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| workout_id | UUID | FK → workouts (CASCADE) |
| exercise_id | UUID | FK → exercises |
| sort_order | INTEGER | |
| notes | TEXT | nullable |

### workout_sets
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| workout_exercise_id | UUID | FK → workout_exercises (CASCADE) |
| set_number | INTEGER | |
| weight | DECIMAL | nullable |
| reps | INTEGER | nullable |
| rpe | DECIMAL | nullable, 1-10 scale |
| is_warmup | BOOLEAN | default: false |
| is_pr | BOOLEAN | default: false |

### personal_records
Denormalized table, updated automatically when a set beats a previous record. Avoids expensive queries on the sets table.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| exercise_id | UUID | FK → exercises |
| workout_set_id | UUID | FK → workout_sets, SET NULL on delete |
| record_type | ENUM | max_weight, max_reps, max_volume, est_1rm |
| value | DECIMAL | |
| achieved_at | DATE | |

### bodyweight_logs
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| weight | DECIMAL | |
| date | DATE | UNIQUE per user |
| notes | TEXT | nullable |
| created_at | TIMESTAMP | |

### goals
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| type | ENUM | workouts_per_week, exercise_target |
| target_value | INTEGER | e.g., 5 workouts/week |
| exercise_id | UUID | FK → exercises, nullable (for exercise_target) |
| target_weight | DECIMAL | nullable (for exercise_target) |
| is_active | BOOLEAN | default: true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Key Indexes
- `workouts(user_id, date)` — calendar queries
- `workout_sets(workout_exercise_id)` — set lookups
- `personal_records(user_id, exercise_id, record_type)` — PR lookups
- `exercises(user_id)` — user's custom exercises
- `bodyweight_logs(user_id, date)` — unique constraint + lookup

## API Endpoints

All endpoints under `/api`. Protected routes require `Authorization: Bearer <token>`. List endpoints support `?page=&limit=` pagination.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Returns access token + refresh cookie |
| POST | /api/auth/refresh | Refresh access token via cookie |
| POST | /api/auth/logout | Invalidate refresh token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/me | Get current user profile |
| PUT | /api/users/me | Update profile |
| PUT | /api/users/me/password | Change password |

### Exercises
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/exercises | List system + user's custom, filter by muscle_group |
| POST | /api/exercises | Create custom exercise |
| PUT | /api/exercises/:id | Update custom exercise (own only) |
| DELETE | /api/exercises/:id | Delete custom exercise (own only) |

### Routines
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/routines | List user's routines |
| GET | /api/routines/:id | Get routine with exercises |
| POST | /api/routines | Create routine |
| PUT | /api/routines/:id | Update routine |
| DELETE | /api/routines/:id | Delete routine |
| POST | /api/routines/:id/duplicate | Duplicate a routine |
| PATCH | /api/routines/:id/favorite | Toggle favorite |
| POST | /api/routines/:id/start | Create workout pre-populated from routine |

### Workouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/workouts | List (paginated, filter by date range, tags, search) |
| GET | /api/workouts/:id | Full workout with exercises + sets |
| POST | /api/workouts | Create workout |
| PUT | /api/workouts/:id | Update workout |
| DELETE | /api/workouts/:id | Delete workout |
| GET | /api/workouts/calendar/:year/:month | Workout dates for calendar view |

### Progress & Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/exercises/:id/history | Set history for exercise (paginated) |
| GET | /api/exercises/:id/records | PRs for an exercise |
| GET | /api/records | All user PRs |

### Bodyweight
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bodyweight | List (filter by date range) |
| POST | /api/bodyweight | Log entry |
| DELETE | /api/bodyweight/:id | Delete entry |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/goals | List active goals with computed progress |
| POST | /api/goals | Create goal |
| PUT | /api/goals/:id | Update goal |
| DELETE | /api/goals/:id | Delete goal |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/summary | Weekly/monthly summary stats |
| GET | /api/analytics/streaks | Current and longest streaks |
| GET | /api/analytics/volume | Volume over time (chart data) |
| GET | /api/analytics/muscle-groups | Muscle group distribution |
| GET | /api/analytics/frequency | Workouts per week/month over time |

## Frontend

### Pages

| Route | Page | Description |
|-------|------|-------------|
| /login | Login | Email + password login |
| /register | Register | Sign up form |
| / | Dashboard | Stats cards, recent workout, volume chart, goal progress, streak |
| /workouts | WorkoutHistory | Searchable/filterable workout list |
| /workouts/active | ActiveWorkout | Live workout logging with sets, rest timer |
| /workouts/:id | WorkoutDetail | View completed workout details |
| /routines | Routines | Routine list with favorites, tags, start button |
| /routines/new | RoutineForm | Create routine |
| /routines/:id/edit | RoutineForm | Edit routine |
| /calendar | Calendar | Monthly calendar with workout markers, click-to-view |
| /analytics | Analytics | Charts, stats, PRs, muscle group breakdown |
| /profile | Profile | User settings, unit preference, theme, password change |

### Navigation
- **Mobile (< 1024px)**: Bottom tab bar with 5 items — Dashboard, Workouts, New (+ button), Calendar, Profile
- **Desktop (>= 1024px)**: Left sidebar with full navigation labels

### Component Architecture

**Layout components**: AppLayout, Sidebar, BottomNav, ProtectedRoute, PageHeader

**UI components**: StatCard, Modal, ConfirmDialog, Toast, LoadingSpinner, EmptyState, ThemeProvider

**Feature components**: WorkoutCard, WorkoutForm, ExerciseEntry, SetRow, ExercisePicker (search + select from catalog), RoutineCard, RoutineForm, RestTimer (countdown + audio alert), Calendar, CalendarDay, ProgressChart, VolumeChart, MuscleGroupPie, StreakBadge, PRBadge, GoalProgress

### State Management
- **React Query**: All server state — workouts, routines, exercises, analytics. Handles caching, background refetching, optimistic updates.
- **AuthContext**: Current user, access token (in memory), login/logout/refresh functions
- **ThemeContext**: Dark/light/system mode, persisted to user profile

## Auth Flow

1. **Register**: Hash password with bcrypt (12 rounds), store user, return access token + set refresh token as httpOnly cookie
2. **Login**: Verify password against hash, return access token + refresh cookie
3. **Access token**: JWT, 15-minute TTL, stored in-memory (React state). Contains `{ userId, email }`
4. **Refresh token**: JWT, 7-day TTL, httpOnly secure cookie
5. **Request auth**: Axios interceptor attaches `Authorization: Bearer <token>` to all API requests
6. **Token refresh**: On 401 response, interceptor calls `/api/auth/refresh`, retries the original request with the new token
7. **Logout**: Server clears refresh cookie, client clears in-memory token

## Key Calculations

- **Estimated 1RM**: Epley formula — `weight * (1 + reps / 30)`
- **Volume**: `weight * reps` per set, summed across exercises/workouts
- **Streak**: Consecutive days with at least one workout, computed from workout dates
- **PR detection**: On each set save, compare against `personal_records` table for that user+exercise. Update if beaten.

## Dark Mode

Tailwind `class` strategy. ThemeProvider reads user preference (system default), applies `dark` class to `<html>`. Toggle in profile settings. Persisted to user's `theme` column.

## Exercise Seed Data

Pre-seed ~80 exercises across muscle groups:
- **Chest**: Bench Press, Incline Bench, Dumbbell Flyes, Cable Crossover, etc.
- **Back**: Deadlift, Barbell Row, Pull-up, Lat Pulldown, Cable Row, etc.
- **Shoulders**: Overhead Press, Lateral Raise, Face Pull, etc.
- **Legs**: Squat, Leg Press, Romanian Deadlift, Leg Curl, Leg Extension, Calf Raise, etc.
- **Arms**: Barbell Curl, Tricep Pushdown, Hammer Curl, Skull Crusher, etc.
- **Core**: Plank, Cable Crunch, Hanging Leg Raise, etc.

Each exercise includes primary muscle group, secondary muscles, and equipment type.
