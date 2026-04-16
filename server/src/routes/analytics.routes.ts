import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

router.get('/summary', analyticsController.summary);
router.get('/streaks', analyticsController.streaks);
router.get('/volume', analyticsController.volume);
router.get('/muscle-groups', analyticsController.muscleGroups);
router.get('/frequency', analyticsController.frequency);

export default router;
