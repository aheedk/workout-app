import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analytics.service';

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getSummary(req.userId!);
    return res.json(data);
  } catch (err) { next(err); }
}

export async function streaks(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getStreaks(req.userId!);
    return res.json(data);
  } catch (err) { next(err); }
}

export async function volume(req: Request, res: Response, next: NextFunction) {
  try {
    const weeks = parseInt(req.query.weeks as string) || 12;
    const data = await analyticsService.getVolume(req.userId!, weeks);
    return res.json(data);
  } catch (err) { next(err); }
}

export async function muscleGroups(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getMuscleGroups(req.userId!);
    return res.json(data);
  } catch (err) { next(err); }
}

export async function frequency(req: Request, res: Response, next: NextFunction) {
  try {
    const weeks = parseInt(req.query.weeks as string) || 12;
    const data = await analyticsService.getFrequency(req.userId!, weeks);
    return res.json(data);
  } catch (err) { next(err); }
}
