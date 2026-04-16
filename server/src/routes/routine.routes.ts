import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as routineController from '../controllers/routine.controller';

const router = Router();

const routineExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  defaultSets: z.number().int().min(1).optional(),
  defaultReps: z.number().int().min(1).optional(),
  defaultWeight: z.number().nullable().optional(),
  restSeconds: z.number().int().min(0).optional(),
});

const createRoutineSchema = z.object({
  name: z.string().min(1).max(100),
  tags: z.array(z.string()).optional(),
  exercises: z.array(routineExerciseSchema).min(1),
});

router.get('/', routineController.list);
router.get('/:id', routineController.get);
router.post('/', validate(createRoutineSchema), routineController.create);
router.put('/:id', validate(createRoutineSchema), routineController.update);
router.delete('/:id', routineController.remove);
router.post('/:id/duplicate', routineController.duplicate);
router.patch('/:id/favorite', routineController.toggleFavorite);
router.post('/:id/start', routineController.startWorkout);

export default router;
