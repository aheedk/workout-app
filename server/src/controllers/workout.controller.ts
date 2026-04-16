import { Request, Response, NextFunction } from 'express';
import * as workoutService from '../services/workout.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const result = await workoutService.listWorkouts(req.userId!, { page, limit, search, tags, startDate, endDate });
    return res.json(result);
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const workout = await workoutService.getWorkout(req.userId!, req.params.id as string);
    return res.json(workout);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const workout = await workoutService.createWorkout(req.userId!, req.body);
    return res.status(201).json(workout);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const workout = await workoutService.updateWorkout(req.userId!, req.params.id as string, req.body);
    return res.json(workout);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await workoutService.deleteWorkout(req.userId!, req.params.id as string);
    return res.status(204).send();
  } catch (err) { next(err); }
}

export async function calendar(req: Request, res: Response, next: NextFunction) {
  try {
    const year = parseInt(req.params.year as string);
    const month = parseInt(req.params.month as string);
    const data = await workoutService.getCalendarData(req.userId!, year, month);
    return res.json(data);
  } catch (err) { next(err); }
}
