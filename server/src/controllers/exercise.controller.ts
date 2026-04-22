import { Request, Response, NextFunction } from 'express';
import * as exerciseService from '../services/exercise.service';
import * as workoutService from '../services/workout.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const muscleGroup = req.query.muscleGroup as string | undefined;
    const exercises = await exerciseService.listExercises(req.userId!, muscleGroup);
    return res.json(exercises);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const exercise = await exerciseService.createExercise(req.userId!, req.body);
    return res.status(201).json(exercise);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const exercise = await exerciseService.updateExercise(req.userId!, req.params.id as string, req.body);
    return res.json(exercise);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await exerciseService.deleteExercise(req.userId!, req.params.id as string);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await exerciseService.getExerciseHistory(req.userId!, req.params.id as string, page, limit);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function records(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await exerciseService.getExerciseRecords(req.userId!, req.params.id as string);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function allRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await exerciseService.getAllRecords(req.userId!);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function backfillRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await workoutService.backfillPRsForUser(req.userId!);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}
