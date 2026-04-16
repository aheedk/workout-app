import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as bodyweightController from '../controllers/bodyweight.controller';

const router = Router();

const createSchema = z.object({
  weight: z.number().positive(),
  date: z.string(),
  notes: z.string().optional(),
});

router.get('/', bodyweightController.list);
router.post('/', validate(createSchema), bodyweightController.create);
router.delete('/:id', bodyweightController.remove);

export default router;
