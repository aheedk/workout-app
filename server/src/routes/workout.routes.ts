import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as workoutController from '../controllers/workout.controller';

const router = Router();

const setSchema = z.object({
  weight: z.number().nullable().optional(),
  reps: z.number().int().nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  isWarmup: z.boolean().optional(),
});

const exerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  notes: z.string().optional(),
  sets: z.array(setSchema).min(1),
});

const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string(),
  routineId: z.string().uuid().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  durationMinutes: z.number().int().optional(),
  exercises: z.array(exerciseSchema).min(1),
});

router.get('/', workoutController.list);
router.get('/calendar/:year/:month', workoutController.calendar);
router.get('/:id', workoutController.get);
router.post('/', validate(createWorkoutSchema), workoutController.create);
router.put('/:id', validate(createWorkoutSchema), workoutController.update);
router.delete('/:id', workoutController.remove);

export default router;
