import { Request, Response, NextFunction } from 'express';
import * as bodyweightService from '../services/bodyweight.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const logs = await bodyweightService.listLogs(req.userId!, startDate, endDate);
    return res.json(logs);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const log = await bodyweightService.createLog(req.userId!, req.body);
    return res.status(201).json(log);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await bodyweightService.deleteLog(req.userId!, req.params.id as string);
    return res.status(204).send();
  } catch (err) { next(err); }
}
