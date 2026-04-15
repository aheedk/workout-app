# Workout App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality workout tracking SaaS with workout logging, routines, exercise progress, calendar, and analytics.

**Architecture:** Monorepo with npm workspaces — `shared/` (types), `server/` (Express + Prisma), `client/` (React + Vite). Backend uses layered architecture (routes → controllers → services → Prisma). Frontend uses React Query for server state, Context for auth/theme.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite, Express, Prisma, PostgreSQL, JWT + bcrypt, Recharts, React Hook Form + Zod, React Router v6, React Query v5

---

## File Structure

```
workout-app/
├── package.json                          # Workspace root
├── tsconfig.base.json                    # Shared TS config
├── .env.example                          # Environment template
├── .gitignore
├── shared/
│   ├── package.json
│   └── src/
│       └── types/
│           ├── index.ts                  # Re-exports all types
│           ├── auth.ts                   # LoginRequest, RegisterRequest, AuthResponse, JwtPayload
│           ├── user.ts                   # User, UpdateProfileRequest
│           ├── exercise.ts               # Exercise, CreateExerciseRequest, MuscleGroup enum
│           ├── routine.ts                # Routine, RoutineExercise, CreateRoutineRequest
│           ├── workout.ts               # Workout, WorkoutExercise, WorkoutSet, CreateWorkoutRequest
│           ├── analytics.ts              # Summary, StreakData, VolumeData, MuscleGroupData
│           ├── goal.ts                   # Goal, CreateGoalRequest
│           ├── bodyweight.ts             # BodyweightLog, CreateBodyweightRequest
│           └── api.ts                    # PaginatedResponse, ApiError
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma                # Full database schema
│   │   └── seed.ts                      # Exercise seed data (~80 exercises)
│   └── src/
│       ├── index.ts                      # Entry: starts Express server
│       ├── app.ts                        # Express app config, middleware, route mounting
│       ├── config/
│       │   └── env.ts                    # Env var validation with Zod
│       ├── middleware/
│       │   ├── auth.ts                   # JWT verification middleware
│       │   ├── validate.ts               # Zod request body validation
│       │   └── errorHandler.ts           # Global error handler
│       ├── routes/
│       │   ├── auth.routes.ts            # /api/auth/*
│       │   ├── user.routes.ts            # /api/users/*
│       │   ├── exercise.routes.ts        # /api/exercises/*
│       │   ├── workout.routes.ts         # /api/workouts/*
│       │   ├── routine.routes.ts         # /api/routines/*
│       │   ├── bodyweight.routes.ts      # /api/bodyweight/*
│       │   ├── goal.routes.ts            # /api/goals/*
│       │   └── analytics.routes.ts       # /api/analytics/*
│       ├── controllers/
│       │   ├── auth.controller.ts        # Register, login, refresh, logout
│       │   ├── user.controller.ts        # Profile CRUD
│       │   ├── exercise.controller.ts    # Exercise CRUD + history + records
│       │   ├── workout.controller.ts     # Workout CRUD + calendar
│       │   ├── routine.controller.ts     # Routine CRUD + duplicate + start
│       │   ├── bodyweight.controller.ts  # Bodyweight log CRUD
│       │   ├── goal.controller.ts        # Goal CRUD
│       │   └── analytics.controller.ts   # Summary, streaks, volume, muscle groups, frequency
│       ├── services/
│       │   ├── auth.service.ts           # Password hashing, token generation/verification
│       │   ├── user.service.ts           # User profile operations
│       │   ├── exercise.service.ts       # Exercise CRUD + filtering
│       │   ├── workout.service.ts        # Workout CRUD + PR detection + calendar query
│       │   ├── routine.service.ts        # Routine CRUD + duplication + workout creation
│       │   ├── bodyweight.service.ts     # Bodyweight CRUD
│       │   ├── goal.service.ts           # Goal CRUD + progress computation
│       │   └── analytics.service.ts      # All analytics computations
│       └── utils/
│           ├── jwt.ts                    # Sign/verify access+refresh tokens
│           ├── calculations.ts           # 1RM (Epley), volume, streak calculation
│           └── prisma.ts                 # Prisma client singleton
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts                    # Proxy /api to server
    ├── tailwind.config.ts                # Dark mode: class strategy
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.tsx                      # ReactDOM.createRoot + providers
        ├── App.tsx                        # Router + layout
        ├── index.css                     # Tailwind directives + global styles
        ├── api/
        │   ├── client.ts                 # Axios instance + interceptors (refresh logic)
        │   ├── auth.ts                   # login, register, refresh, logout
        │   ├── workouts.ts               # Workout API calls + React Query hooks
        │   ├── routines.ts               # Routine API calls + hooks
        │   ├── exercises.ts              # Exercise API calls + hooks
        │   ├── bodyweight.ts             # Bodyweight API calls + hooks
        │   ├── goals.ts                  # Goal API calls + hooks
        │   └── analytics.ts              # Analytics API calls + hooks
        ├── components/
        │   ├── layout/
        │   │   ├── AppLayout.tsx          # Sidebar (desktop) + BottomNav (mobile) + main content
        │   │   ├── Sidebar.tsx            # Desktop left sidebar navigation
        │   │   └── BottomNav.tsx          # Mobile bottom tab bar
        │   ├── ui/
        │   │   ├── StatCard.tsx           # Stat display card (icon, value, label)
        │   │   ├── Modal.tsx              # Reusable modal dialog
        │   │   ├── ConfirmDialog.tsx      # Confirm/cancel modal
        │   │   ├── Toast.tsx              # Toast notification system
        │   │   ├── LoadingSpinner.tsx     # Loading indicator
        │   │   ├── EmptyState.tsx         # Empty list state with icon + message
        │   │   └── PageHeader.tsx         # Page title + optional action button
        │   └── features/
        │       ├── WorkoutCard.tsx        # Workout list item (name, date, exercises, PR badges)
        │       ├── WorkoutForm.tsx        # Create/edit workout form
        │       ├── ExerciseEntry.tsx      # Single exercise in workout form (with sets)
        │       ├── SetRow.tsx             # Single set row (weight, reps, RPE, checkbox)
        │       ├── ExercisePicker.tsx     # Search + select exercise modal
        │       ├── RoutineCard.tsx        # Routine list item (name, exercises, favorite, start)
        │       ├── RoutineForm.tsx        # Create/edit routine form
        │       ├── RestTimer.tsx          # Countdown timer with audio alert
        │       ├── Calendar.tsx           # Monthly calendar grid
        │       ├── CalendarDay.tsx        # Single day cell in calendar
        │       ├── ProgressChart.tsx      # Exercise progress line chart (Recharts)
        │       ├── VolumeChart.tsx        # Volume over time bar chart
        │       ├── MuscleGroupPie.tsx     # Muscle group distribution pie chart
        │       ├── StreakBadge.tsx         # Current streak display
        │       ├── PRBadge.tsx            # Personal record indicator
        │       └── GoalProgress.tsx       # Goal progress bar
        ├── pages/
        │   ├── Dashboard.tsx              # Stats, recent workout, volume chart, goals, streak
        │   ├── Login.tsx                  # Login form
        │   ├── Register.tsx               # Registration form
        │   ├── WorkoutHistory.tsx         # Searchable/filterable workout list
        │   ├── ActiveWorkout.tsx          # Live workout logging (sets, timer, previous perf)
        │   ├── WorkoutDetail.tsx          # View completed workout
        │   ├── Routines.tsx               # Routine list page
        │   ├── RoutineFormPage.tsx         # Create/edit routine page
        │   ├── CalendarPage.tsx           # Calendar view page
        │   ├── Analytics.tsx              # Analytics dashboard page
        │   └── Profile.tsx                # User settings page
        ├── hooks/
        │   ├── useAuth.ts                 # Auth context consumer hook
        │   ├── useTimer.ts                # Rest timer countdown hook
        │   └── useTheme.ts                # Theme context consumer hook
        ├── context/
        │   ├── AuthContext.tsx             # Auth state + token management
        │   └── ThemeContext.tsx            # Dark/light/system mode
        └── utils/
            ├── formatting.ts              # Weight display, date formatting, duration
            └── calculations.ts            # Client-side 1RM, volume calc

```

---

## Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `.env.example`
- Create: `shared/package.json`, `shared/src/types/index.ts`
- Create: `server/package.json`, `server/tsconfig.json`, `server/src/index.ts`
- Create: `client/package.json`, `client/tsconfig.json`, `client/vite.config.ts`, `client/index.html`

- [ ] **Step 1: Create root `package.json` with npm workspaces**

```json
{
  "name": "workout-app",
  "private": true,
  "workspaces": ["shared", "server", "client"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w server\" \"npm run dev -w client\"",
    "dev:server": "npm run dev -w server",
    "dev:client": "npm run dev -w client",
    "build": "npm run build -w shared && npm run build -w server && npm run build -w client",
    "db:migrate": "npm run db:migrate -w server",
    "db:seed": "npm run db:seed -w server",
    "db:reset": "npm run db:reset -w server"
  },
  "devDependencies": {
    "concurrently": "^9.1.2",
    "typescript": "^5.7.3"
  }
}
```

- [ ] **Step 2: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: Create `shared/` package with types**

`shared/package.json`:
```json
{
  "name": "@workout-app/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./src/types/index.ts",
  "types": "./src/types/index.ts"
}
```

`shared/src/types/api.ts`:
```typescript
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
```

`shared/src/types/index.ts`:
```typescript
export * from './api';
```

- [ ] **Step 4: Create `server/` package**

`server/package.json`:
```json
{
  "name": "@workout-app/server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset --force"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^6.5.0",
    "@workout-app/shared": "*",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.9",
    "prisma": "^6.5.0",
    "tsx": "^4.19.3"
  }
}
```

`server/tsconfig.json`:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../shared" }]
}
```

`server/src/index.ts`:
```typescript
import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
```

- [ ] **Step 5: Create `client/` package**

`client/package.json`:
```json
{
  "name": "@workout-app/client",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.74.4",
    "@workout-app/shared": "*",
    "axios": "^1.8.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.2",
    "react-router-dom": "^6.30.0",
    "recharts": "^2.15.3",
    "zod": "^3.24.2",
    "@hookform/resolvers": "^5.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.20",
    "@types/react-dom": "^18.3.6",
    "@vitejs/plugin-react": "^4.4.1",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "vite": "^6.3.2"
  }
}
```

`client/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

`client/tsconfig.json`:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "noEmit": true
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../shared" }]
}
```

`client/tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
```

`client/postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

`client/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Workout Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`client/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`client/src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold p-8">Workout Tracker</h1>
    </div>
  </React.StrictMode>
);
```

- [ ] **Step 6: Create `.env.example`**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/workout_app
JWT_ACCESS_SECRET=your-access-secret-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
PORT=3001
NODE_ENV=development
```

- [ ] **Step 7: Install dependencies and verify**

```bash
npm install
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold monorepo with shared types, server, and client packages"
```

---

## Task 2: Shared Types

**Files:**
- Create: `shared/src/types/auth.ts`, `user.ts`, `exercise.ts`, `routine.ts`, `workout.ts`, `analytics.ts`, `goal.ts`, `bodyweight.ts`
- Modify: `shared/src/types/index.ts`

- [ ] **Step 1: Create all shared type definitions**

`shared/src/types/auth.ts`:
```typescript
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    unitPreference: 'kg' | 'lb';
    theme: 'light' | 'dark' | 'system';
  };
  accessToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}
```

`shared/src/types/user.ts`:
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  unitPreference: 'kg' | 'lb';
  theme: 'light' | 'dark' | 'system';
  createdAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  unitPreference?: 'kg' | 'lb';
  theme?: 'light' | 'dark' | 'system';
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

`shared/src/types/exercise.ts`:
```typescript
export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'cardio', 'other',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'band', 'kettlebell', 'other',
] as const;

export type Equipment = (typeof EQUIPMENT_TYPES)[number];

export interface Exercise {
  id: string;
  userId: string | null;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: string[];
  equipment: Equipment | null;
  isCustom: boolean;
}

export interface CreateExerciseRequest {
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: string[];
  equipment?: Equipment;
}

export interface ExerciseHistory {
  date: string;
  workoutName: string;
  sets: { setNumber: number; weight: number | null; reps: number | null; rpe: number | null }[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  recordType: 'max_weight' | 'max_reps' | 'max_volume' | 'est_1rm';
  value: number;
  achievedAt: string;
}
```

`shared/src/types/workout.ts`:
```typescript
export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  isWarmup: boolean;
  isPr: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sortOrder: number;
  notes: string | null;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  routineId: string | null;
  name: string;
  date: string;
  startedAt: string;
  completedAt: string | null;
  durationMinutes: number | null;
  notes: string | null;
  tags: string[];
  exercises: WorkoutExercise[];
}

export interface WorkoutSummary {
  id: string;
  name: string;
  date: string;
  durationMinutes: number | null;
  tags: string[];
  exerciseCount: number;
  totalVolume: number;
  hasPr: boolean;
}

export interface CreateWorkoutSetInput {
  weight?: number | null;
  reps?: number | null;
  rpe?: number | null;
  isWarmup?: boolean;
}

export interface CreateWorkoutExerciseInput {
  exerciseId: string;
  notes?: string;
  sets: CreateWorkoutSetInput[];
}

export interface CreateWorkoutRequest {
  name: string;
  date: string;
  routineId?: string;
  notes?: string;
  tags?: string[];
  durationMinutes?: number;
  exercises: CreateWorkoutExerciseInput[];
}

export interface CalendarDay {
  date: string;
  workoutCount: number;
  workoutIds: string[];
}
```

`shared/src/types/routine.ts`:
```typescript
export interface RoutineExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sortOrder: number;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number | null;
  restSeconds: number;
}

export interface Routine {
  id: string;
  name: string;
  tags: string[];
  isFavorite: boolean;
  lastUsedAt: string | null;
  exercises: RoutineExercise[];
  createdAt: string;
}

export interface CreateRoutineExerciseInput {
  exerciseId: string;
  defaultSets?: number;
  defaultReps?: number;
  defaultWeight?: number | null;
  restSeconds?: number;
}

export interface CreateRoutineRequest {
  name: string;
  tags?: string[];
  exercises: CreateRoutineExerciseInput[];
}
```

`shared/src/types/analytics.ts`:
```typescript
export interface AnalyticsSummary {
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  totalVolumeThisWeek: number;
  totalVolumeThisMonth: number;
  avgDurationMinutes: number;
  recentWorkout: { id: string; name: string; date: string } | null;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
}

export interface VolumeDataPoint {
  date: string;
  volume: number;
}

export interface MuscleGroupData {
  muscleGroup: string;
  count: number;
  percentage: number;
}

export interface FrequencyDataPoint {
  week: string;
  count: number;
}
```

`shared/src/types/goal.ts`:
```typescript
export interface Goal {
  id: string;
  type: 'workouts_per_week' | 'exercise_target';
  targetValue: number;
  exerciseId: string | null;
  exerciseName: string | null;
  targetWeight: number | null;
  isActive: boolean;
  currentProgress: number;
  createdAt: string;
}

export interface CreateGoalRequest {
  type: 'workouts_per_week' | 'exercise_target';
  targetValue: number;
  exerciseId?: string;
  targetWeight?: number;
}
```

`shared/src/types/bodyweight.ts`:
```typescript
export interface BodyweightLog {
  id: string;
  weight: number;
  date: string;
  notes: string | null;
}

export interface CreateBodyweightRequest {
  weight: number;
  date: string;
  notes?: string;
}
```

- [ ] **Step 2: Update `shared/src/types/index.ts` to re-export everything**

```typescript
export * from './api';
export * from './auth';
export * from './user';
export * from './exercise';
export * from './routine';
export * from './workout';
export * from './analytics';
export * from './goal';
export * from './bodyweight';
```

- [ ] **Step 3: Commit**

```bash
git add shared/
git commit -m "feat: add all shared TypeScript type definitions"
```

---

## Task 3: Prisma Schema + Server Foundation

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/src/app.ts`, `server/src/config/env.ts`, `server/src/utils/prisma.ts`
- Create: `server/src/middleware/errorHandler.ts`, `server/src/middleware/validate.ts`

- [ ] **Step 1: Create Prisma schema**

`server/prisma/schema.prisma` — Full 10-table schema matching the design spec. All UUIDs, proper relations, cascade deletes on child records, enums for unit_preference, theme, record_type, goal_type. Indexes on `workouts(userId, date)`, `personalRecords(userId, exerciseId, recordType)`, `bodyweightLogs(userId, date)`.

- [ ] **Step 2: Create server foundation files**

`server/src/config/env.ts` — Zod schema validating DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, PORT, NODE_ENV. Parses `process.env` and exports typed `env` object.

`server/src/utils/prisma.ts` — Prisma client singleton.

`server/src/app.ts` — Express app with cors (credentials: true), cookie-parser, express.json(), error handler. Mounts routes at `/api/*`.

`server/src/middleware/errorHandler.ts` — Global error handler that catches thrown errors with statusCode and returns JSON `{ message, statusCode }`.

`server/src/middleware/validate.ts` — Middleware factory that takes a Zod schema, validates `req.body`, returns 400 with error details on failure.

- [ ] **Step 3: Run Prisma migrate**

```bash
cd server && npx prisma migrate dev --name init
```

- [ ] **Step 4: Commit**

```bash
git add server/
git commit -m "feat: add Prisma schema and server foundation (env, middleware, app setup)"
```

---

## Task 4: Auth System (Backend)

**Files:**
- Create: `server/src/utils/jwt.ts`
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/services/auth.service.ts`
- Create: `server/src/controllers/auth.controller.ts`
- Create: `server/src/routes/auth.routes.ts`

- [ ] **Step 1: Create JWT utilities**

`server/src/utils/jwt.ts` — `generateAccessToken(payload)` with 15m expiry, `generateRefreshToken(payload)` with 7d expiry, `verifyAccessToken(token)`, `verifyRefreshToken(token)`. Uses env secrets.

- [ ] **Step 2: Create auth middleware**

`server/src/middleware/auth.ts` — Extracts Bearer token from Authorization header, verifies with `verifyAccessToken`, attaches `userId` and `email` to `req`. Returns 401 on missing/invalid token.

- [ ] **Step 3: Create auth service**

`server/src/services/auth.service.ts` — `register(email, password, name)` hashes password with bcrypt (12 rounds), creates user via Prisma, returns user + tokens. `login(email, password)` finds user, compares password, returns user + tokens. `refreshToken(token)` verifies refresh token, generates new access token.

- [ ] **Step 4: Create auth controller + routes**

`server/src/controllers/auth.controller.ts` — POST handlers for register, login, refresh, logout. Sets refresh token as httpOnly cookie. Returns access token + user in response body.

`server/src/routes/auth.routes.ts` — Maps POST /register, /login, /refresh, /logout to controller. Uses validate middleware with Zod schemas for register and login.

- [ ] **Step 5: Mount auth routes in app.ts**

Add `app.use('/api/auth', authRoutes)` to `app.ts`.

- [ ] **Step 6: Test auth endpoints manually**

```bash
npm run dev:server
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"password123","name":"Test User"}'
```

- [ ] **Step 7: Commit**

```bash
git commit -m "feat: implement JWT auth system (register, login, refresh, logout)"
```

---

## Task 5: User, Exercise, Routine, Workout CRUD (Backend)

**Files:**
- Create: All remaining controllers, services, and routes in `server/src/`

- [ ] **Step 1: User profile endpoints**

Service: `getProfile(userId)`, `updateProfile(userId, data)`, `changePassword(userId, currentPassword, newPassword)`
Controller + Routes: GET /api/users/me, PUT /api/users/me, PUT /api/users/me/password. All protected by auth middleware.

- [ ] **Step 2: Exercise endpoints**

Service: `listExercises(userId, muscleGroup?)` returns system exercises (user_id=null) + user's custom. `createExercise(userId, data)`, `updateExercise(userId, exerciseId, data)`, `deleteExercise(userId, exerciseId)` — only allows modifying own custom exercises. `getExerciseHistory(userId, exerciseId, page, limit)` returns past sets grouped by workout. `getExerciseRecords(userId, exerciseId)` returns PRs.
Controller + Routes: Full CRUD + GET /:id/history, GET /:id/records, GET /api/records (all user PRs).

- [ ] **Step 3: Routine endpoints**

Service: `listRoutines(userId)`, `getRoutine(userId, routineId)`, `createRoutine(userId, data)` creates routine + routine_exercises in a transaction. `updateRoutine` replaces routine_exercises (delete all + recreate). `deleteRoutine`, `duplicateRoutine` copies routine + exercises with new name "[name] (copy)". `toggleFavorite`. `startWorkout(userId, routineId)` creates a new workout pre-populated with exercises from the routine (using default sets/reps/weight), updates routine's `lastUsedAt`.
Controller + Routes: Full CRUD + POST /:id/duplicate, PATCH /:id/favorite, POST /:id/start.

- [ ] **Step 4: Workout endpoints**

Service: `listWorkouts(userId, { page, limit, search, tags, startDate, endDate })`. `getWorkout(userId, workoutId)` returns full workout with exercises + sets + exercise names. `createWorkout(userId, data)` creates workout + exercises + sets in a transaction, then calls PR detection. `updateWorkout` replaces exercises/sets. `deleteWorkout`. `getCalendarData(userId, year, month)` returns dates with workout counts.

`server/src/utils/calculations.ts` — `calculateEstimated1RM(weight, reps)` Epley formula, `calculateVolume(weight, reps)`, `detectPRs(userId, exerciseId, sets)` compares new sets against personal_records table for max_weight, max_reps, max_volume, est_1rm — updates if beaten.

Controller + Routes: Full CRUD + GET /calendar/:year/:month.

- [ ] **Step 5: Mount all routes in app.ts**

```typescript
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/exercises', authenticate, exerciseRoutes);
app.use('/api/routines', authenticate, routineRoutes);
app.use('/api/workouts', authenticate, workoutRoutes);
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: implement user, exercise, routine, and workout CRUD endpoints"
```

---

## Task 6: Bodyweight, Goals, Analytics (Backend)

**Files:**
- Create: Remaining controllers, services, routes for bodyweight, goals, analytics

- [ ] **Step 1: Bodyweight endpoints**

Service: `listLogs(userId, startDate?, endDate?)`, `createLog(userId, data)` with upsert on same date, `deleteLog(userId, logId)`.
Controller + Routes: GET, POST, DELETE at /api/bodyweight.

- [ ] **Step 2: Goal endpoints**

Service: `listGoals(userId)` returns goals with computed `currentProgress`. For `workouts_per_week`: count workouts in current week. For `exercise_target`: get max weight for that exercise. `createGoal`, `updateGoal`, `deleteGoal`.
Controller + Routes: Full CRUD at /api/goals.

- [ ] **Step 3: Analytics endpoints**

Service:
- `getSummary(userId)` — workouts this week/month, total volume this week/month, avg duration, most recent workout
- `getStreaks(userId)` — query all workout dates, compute current consecutive days streak and longest ever
- `getVolume(userId, period)` — aggregate volume by day/week over last 12 weeks
- `getMuscleGroups(userId)` — count workout_exercises grouped by exercise.muscle_group, compute percentages
- `getFrequency(userId)` — workouts per week over last 12 weeks

Controller + Routes: GET endpoints at /api/analytics/*.

- [ ] **Step 4: Mount routes and test**

Mount bodyweight, goal, analytics routes in app.ts. Test with curl.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: implement bodyweight, goals, and analytics endpoints"
```

---

## Task 7: Exercise Seed Data

**Files:**
- Create: `server/prisma/seed.ts`

- [ ] **Step 1: Create seed file with ~80 exercises**

Exercises organized by muscle group (chest, back, shoulders, legs, arms, core) with primary muscle group, secondary muscles array, and equipment type. All with `userId: null` and `isCustom: false`.

- [ ] **Step 2: Run seed**

```bash
npm run db:seed -w server
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add exercise seed data (~80 exercises across 6 muscle groups)"
```

---

## Task 8: Frontend Foundation — Auth, Layout, Routing

**Files:**
- Create: `client/src/App.tsx`, `client/src/api/client.ts`, `client/src/api/auth.ts`
- Create: `client/src/context/AuthContext.tsx`, `client/src/context/ThemeContext.tsx`
- Create: `client/src/hooks/useAuth.ts`, `client/src/hooks/useTheme.ts`
- Create: `client/src/components/layout/AppLayout.tsx`, `Sidebar.tsx`, `BottomNav.tsx`
- Create: `client/src/components/ui/LoadingSpinner.tsx`, `PageHeader.tsx`
- Create: `client/src/pages/Login.tsx`, `client/src/pages/Register.tsx`

- [ ] **Step 1: Create axios client with interceptors**

`client/src/api/client.ts` — Axios instance pointed at `/api`. Request interceptor adds Bearer token from auth context. Response interceptor catches 401, calls `/api/auth/refresh`, retries original request. Queues concurrent requests during refresh.

- [ ] **Step 2: Create auth API + context**

`client/src/api/auth.ts` — `login(data)`, `register(data)`, `refresh()`, `logout()` functions using axios client.

`client/src/context/AuthContext.tsx` — Provides `user`, `accessToken` (in state), `login`, `register`, `logout` functions. On mount, attempts token refresh to restore session. Renders loading spinner until initial auth check completes.

`client/src/hooks/useAuth.ts` — `useAuth()` consumes AuthContext.

- [ ] **Step 3: Create theme context**

`client/src/context/ThemeContext.tsx` — Reads system preference via `matchMedia`, applies `dark` class to `<html>`. Supports light/dark/system. Persists preference. `useTheme()` hook.

- [ ] **Step 4: Create layout components**

`AppLayout.tsx` — Sidebar on desktop (lg:), BottomNav on mobile, `<main>` content area with padding.

`Sidebar.tsx` — Fixed left sidebar with nav links: Dashboard, Workouts, Routines, Calendar, Analytics, Profile. Highlights active route. App logo at top.

`BottomNav.tsx` — Fixed bottom bar with 5 icons: Dashboard, Workouts, + (New), Calendar, Profile.

- [ ] **Step 5: Create Login and Register pages**

`Login.tsx` — Form with email + password, uses React Hook Form + Zod validation, calls `login()` from auth context, redirects to dashboard on success. Link to register.

`Register.tsx` — Form with name + email + password + confirm password, validates, calls `register()`, redirects. Link to login.

- [ ] **Step 6: Create App.tsx with routing**

React Router with routes: /login, /register (public), / (Dashboard), /workouts, /workouts/active, /workouts/:id, /routines, /routines/new, /routines/:id/edit, /calendar, /analytics, /profile (all wrapped in ProtectedRoute + AppLayout). QueryClientProvider + AuthProvider + ThemeProvider wrapping everything.

- [ ] **Step 7: Update main.tsx**

Replace placeholder with `<App />` component.

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev:client
```

- [ ] **Step 9: Commit**

```bash
git commit -m "feat: add frontend foundation — auth, routing, layout, login/register pages"
```

---

## Task 9: Frontend Pages — Dashboard, Workouts, Routines

**Files:**
- Create: All API hook files, UI components, feature components, pages

- [ ] **Step 1: Create shared UI components**

`StatCard.tsx` — Displays icon, value, label in a card. Tailwind styled.
`Modal.tsx` — Overlay modal with close button, renders children.
`ConfirmDialog.tsx` — Modal with message + confirm/cancel buttons.
`Toast.tsx` — Toast notification system (success/error/info) with auto-dismiss.
`EmptyState.tsx` — Centered icon + message + optional action button.

- [ ] **Step 2: Create API hooks for workouts, routines, exercises**

`client/src/api/workouts.ts` — React Query hooks: `useWorkouts(filters)`, `useWorkout(id)`, `useCreateWorkout()`, `useUpdateWorkout()`, `useDeleteWorkout()`, `useCalendarData(year, month)`.

`client/src/api/routines.ts` — `useRoutines()`, `useRoutine(id)`, `useCreateRoutine()`, `useUpdateRoutine()`, `useDeleteRoutine()`, `useDuplicateRoutine()`, `useToggleFavorite()`, `useStartWorkout()`.

`client/src/api/exercises.ts` — `useExercises(muscleGroup?)`, `useExerciseHistory(id)`, `useExerciseRecords(id)`, `useCreateExercise()`.

`client/src/api/analytics.ts` — `useSummary()`, `useStreaks()`, `useVolume()`, `useMuscleGroups()`, `useFrequency()`.

`client/src/api/goals.ts` — `useGoals()`, `useCreateGoal()`, `useDeleteGoal()`.

`client/src/api/bodyweight.ts` — `useBodyweightLogs()`, `useLogBodyweight()`.

- [ ] **Step 3: Dashboard page**

`Dashboard.tsx` — Grid of StatCards (workouts this week, streak, total volume, avg duration). Recent workout card. Mini volume chart (Recharts). Goal progress bars. Quick-start buttons for favorite routines.

- [ ] **Step 4: Workout History page**

`WorkoutHistory.tsx` — Search input + tag filter pills. Paginated list of WorkoutCards. Each card shows name, date, exercise summary, duration, volume, PR badges.

`WorkoutCard.tsx` — Clickable card linking to /workouts/:id.

`WorkoutDetail.tsx` — Full workout view with all exercises + sets in a table layout. Edit/delete buttons.

- [ ] **Step 5: Routines page**

`Routines.tsx` — List of RoutineCards with tag filter. "New Routine" button.

`RoutineCard.tsx` — Shows name, exercise count, last used, favorite star, "Start" button.

`RoutineFormPage.tsx` — Uses RoutineForm component. Add exercises via ExercisePicker. Set default sets/reps/weight per exercise. Drag-to-reorder.

`ExercisePicker.tsx` — Modal with search input + muscle group filter. Lists matching exercises. Click to select.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: add dashboard, workout history, and routines pages"
```

---

## Task 10: Active Workout Logging

**Files:**
- Create: `client/src/pages/ActiveWorkout.tsx`
- Create: `client/src/components/features/ExerciseEntry.tsx`, `SetRow.tsx`, `RestTimer.tsx`
- Create: `client/src/hooks/useTimer.ts`

- [ ] **Step 1: Create rest timer hook**

`useTimer.ts` — `useTimer(initialSeconds)` returns `{ seconds, isRunning, start, pause, reset }`. Uses `setInterval`. Plays audio beep when reaching 0.

- [ ] **Step 2: Create set and exercise components**

`SetRow.tsx` — Grid row: set number, weight input, reps input, RPE dropdown (optional), warmup toggle, completion checkbox. Shows previous performance (last time's weight/reps) in subtle text.

`ExerciseEntry.tsx` — Exercise name header (with previous best displayed), list of SetRows, "Add Set" button, notes textarea. Collapsible.

`RestTimer.tsx` — Circular countdown display, start/pause/reset buttons. Configurable duration (30s, 60s, 90s, 120s, custom). Audio alert on complete.

- [ ] **Step 3: Active Workout page**

`ActiveWorkout.tsx` — Workout name input, running duration timer at top, list of ExerciseEntries, "Add Exercise" button (opens ExercisePicker), rest timer component, "Finish Workout" button. On finish: computes duration, calls createWorkout API, navigates to workout detail. Can be started blank or from a routine (reads routine exercises from location state).

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add active workout logging with rest timer and set tracking"
```

---

## Task 11: Calendar + Analytics Pages

**Files:**
- Create: `client/src/pages/CalendarPage.tsx`, `client/src/pages/Analytics.tsx`
- Create: Calendar and chart components

- [ ] **Step 1: Calendar components**

`CalendarDay.tsx` — Day cell. Blue dot/fill for workout days, green for today, gray for rest days. Click handler.

`Calendar.tsx` — Month grid (7 columns). Prev/next month navigation. Fetches calendar data via `useCalendarData`. On day click, shows workout summary below calendar.

`CalendarPage.tsx` — Calendar component + selected day detail panel showing workout name, duration, volume, link to full detail.

- [ ] **Step 2: Chart components**

`VolumeChart.tsx` — Recharts BarChart. Weekly volume over last 12 weeks. Responsive. Tooltip with exact values.

`ProgressChart.tsx` — Recharts LineChart. Max weight over time for a selected exercise. Exercise dropdown selector.

`MuscleGroupPie.tsx` — Recharts PieChart. Muscle group distribution with labels and percentages.

- [ ] **Step 3: Analytics page**

`Analytics.tsx` — Top row: 3 StatCards (workouts this month, total volume, avg duration). StreakBadge. VolumeChart (full width). Two-column grid: MuscleGroupPie + recent PRs list. FrequencyChart (workouts per week). Exercise progress section with exercise picker + ProgressChart.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add calendar and analytics pages with charts"
```

---

## Task 12: Profile, Goals, Bodyweight + Polish

**Files:**
- Create: `client/src/pages/Profile.tsx`
- Create: `client/src/components/features/GoalProgress.tsx`

- [ ] **Step 1: Profile page**

`Profile.tsx` — Edit name, unit preference (kg/lb toggle), theme selector (light/dark/system), change password form, bodyweight log section (list + add entry), goals section (list + create goal). Logout button.

- [ ] **Step 2: Goal and bodyweight components**

`GoalProgress.tsx` — Progress bar with label (e.g., "3/5 workouts this week"). Color changes as progress increases.

Bodyweight section: simple list with date + weight + delete. "Log Weight" form (date + weight + optional notes).

- [ ] **Step 3: Dark mode polish**

Ensure all components use Tailwind dark: variants. Test light/dark/system modes. Ensure proper contrast ratios.

- [ ] **Step 4: Responsive polish**

Test all pages at mobile (375px), tablet (768px), desktop (1280px). Fix any layout issues. Ensure bottom nav only shows on mobile, sidebar only on desktop.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add profile page, goals, bodyweight, dark mode, responsive polish"
```

---

## Task 13: Seed Data + README

**Files:**
- Modify: `server/prisma/seed.ts` (add demo user + workout data)
- Create: `README.md`

- [ ] **Step 1: Expand seed data**

Add to `seed.ts`: demo user (demo@workout.app / password123), 3 routines (Push/Pull/Legs), 20+ historical workouts over the past 30 days with realistic sets/reps/weights, bodyweight entries, goals, computed personal records. This gives a populated dashboard and analytics on first login.

- [ ] **Step 2: Write README**

Professional README with: project description, screenshot placeholder, tech stack, features list, prerequisites (Node 18+, PostgreSQL), setup instructions (clone, install, create .env, migrate, seed, run), available scripts, project structure overview, API documentation link to design spec.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add demo seed data and professional README"
```

---

## Summary

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Monorepo scaffolding | `feat: scaffold monorepo` |
| 2 | Shared types | `feat: add shared types` |
| 3 | Prisma schema + server foundation | `feat: add Prisma schema and server foundation` |
| 4 | Auth system | `feat: implement JWT auth system` |
| 5 | User, Exercise, Routine, Workout CRUD | `feat: implement CRUD endpoints` |
| 6 | Bodyweight, Goals, Analytics | `feat: implement bodyweight, goals, analytics` |
| 7 | Exercise seed data | `feat: add exercise seed data` |
| 8 | Frontend foundation | `feat: add frontend foundation` |
| 9 | Dashboard, Workouts, Routines pages | `feat: add dashboard, workout history, routines` |
| 10 | Active workout logging | `feat: add active workout logging` |
| 11 | Calendar + Analytics pages | `feat: add calendar and analytics` |
| 12 | Profile, Goals, Dark mode, Polish | `feat: add profile, goals, polish` |
| 13 | Seed data + README | `feat: add demo seed data and README` |
