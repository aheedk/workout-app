import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as userController from '../controllers/user.controller';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  unitPreference: z.enum(['kg', 'lb']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.get('/me', userController.getProfile);
router.put('/me', validate(updateProfileSchema), userController.updateProfile);
router.put('/me/password', validate(changePasswordSchema), userController.changePassword);

export default router;
