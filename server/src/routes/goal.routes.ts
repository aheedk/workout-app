import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as goalController from '../controllers/goal.controller';

const router = Router();

const createGoalSchema = z.object({
  type: z.enum(['workouts_per_week', 'exercise_target']),
  targetValue: z.number().int().positive(),
  exerciseId: z.string().uuid().optional(),
  targetWeight: z.number().positive().optional(),
});

router.get('/', goalController.list);
router.post('/', validate(createGoalSchema), goalController.create);
router.put('/:id', goalController.update);
router.delete('/:id', goalController.remove);

export default router;
