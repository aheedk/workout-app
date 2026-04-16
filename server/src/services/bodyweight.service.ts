import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function listLogs(userId: string, startDate?: string, endDate?: string) {
  const where: any = { userId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const logs = await prisma.bodyweightLog.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  return logs.map((l) => ({
    id: l.id,
    weight: Number(l.weight),
    date: l.date.toISOString().split('T')[0],
    notes: l.notes,
  }));
}

export async function createLog(userId: string, data: { weight: number; date: string; notes?: string }) {
  const date = new Date(data.date);
  const log = await prisma.bodyweightLog.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, weight: data.weight, date, notes: data.notes || null },
    update: { weight: data.weight, notes: data.notes || null },
  });

  return { id: log.id, weight: Number(log.weight), date: log.date.toISOString().split('T')[0], notes: log.notes };
}

export async function deleteLog(userId: string, logId: string) {
  const log = await prisma.bodyweightLog.findFirst({ where: { id: logId, userId } });
  if (!log) throw new AppError('Log not found', 404);
  await prisma.bodyweightLog.delete({ where: { id: logId } });
}
