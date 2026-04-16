import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getProfile(req.userId!);
    return res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateProfile(req.userId!, req.body);
    return res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.changePassword(req.userId!, req.body.currentPassword, req.body.newPassword);
    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}
