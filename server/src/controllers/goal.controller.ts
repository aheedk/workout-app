import { Request, Response, NextFunction } from 'express';
import * as goalService from '../services/goal.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const goals = await goalService.listGoals(req.userId!);
    return res.json(goals);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const goal = await goalService.createGoal(req.userId!, req.body);
    return res.status(201).json(goal);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    await goalService.updateGoal(req.userId!, req.params.id as string, req.body);
    return res.json({ message: 'Goal updated' });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await goalService.deleteGoal(req.userId!, req.params.id as string);
    return res.status(204).send();
  } catch (err) { next(err); }
}
