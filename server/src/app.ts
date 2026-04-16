import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import exerciseRoutes from './routes/exercise.routes';
import routineRoutes from './routes/routine.routes';
import workoutRoutes from './routes/workout.routes';
import bodyweightRoutes from './routes/bodyweight.routes';
import goalRoutes from './routes/goal.routes';
import analyticsRoutes from './routes/analytics.routes';
import * as exerciseController from './controllers/exercise.controller';

export const app = express();

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authenticate, userRoutes);
app.use('/api/exercises', authenticate, exerciseRoutes);
app.use('/api/routines', authenticate, routineRoutes);
app.use('/api/workouts', authenticate, workoutRoutes);
app.use('/api/bodyweight', authenticate, bodyweightRoutes);
app.use('/api/goals', authenticate, goalRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);

// All user PRs endpoint
app.get('/api/records', authenticate, exerciseController.allRecords);

app.use(errorHandler);
