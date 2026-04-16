import { Request, Response, NextFunction } from 'express';
import * as routineService from '../services/routine.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const routines = await routineService.listRoutines(req.userId!);
    return res.json(routines);
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const routine = await routineService.getRoutine(req.userId!, req.params.id as string);
    return res.json(routine);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const routine = await routineService.createRoutine(req.userId!, req.body);
    return res.status(201).json(routine);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const routine = await routineService.updateRoutine(req.userId!, req.params.id as string, req.body);
    return res.json(routine);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await routineService.deleteRoutine(req.userId!, req.params.id as string);
    return res.status(204).send();
  } catch (err) { next(err); }
}

export async function duplicate(req: Request, res: Response, next: NextFunction) {
  try {
    const routine = await routineService.duplicateRoutine(req.userId!, req.params.id as string);
    return res.status(201).json(routine);
  } catch (err) { next(err); }
}

export async function toggleFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const routine = await routineService.toggleFavorite(req.userId!, req.params.id as string);
    return res.json(routine);
  } catch (err) { next(err); }
}

export async function startWorkout(req: Request, res: Response, next: NextFunction) {
  try {
    const workout = await routineService.startWorkout(req.userId!, req.params.id as string);
    return res.status(201).json(workout);
  } catch (err) { next(err); }
}
