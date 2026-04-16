import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as exerciseController from '../controllers/exercise.controller';

const router = Router();

const createExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  muscleGroup: z.string().min(1),
  secondaryMuscles: z.array(z.string()).optional(),
  equipment: z.string().optional(),
});

router.get('/', exerciseController.list);
router.post('/', validate(createExerciseSchema), exerciseController.create);
router.put('/:id', exerciseController.update);
router.delete('/:id', exerciseController.remove);
router.get('/:id/history', exerciseController.history);
router.get('/:id/records', exerciseController.records);

export default router;
