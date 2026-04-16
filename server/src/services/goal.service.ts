import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function listGoals(userId: string) {
  const goals = await prisma.goal.findMany({
    where: { userId, isActive: true },
    include: { exercise: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const workoutsThisWeek = await prisma.workout.count({
    where: { userId, date: { gte: startOfWeek } },
  });

  return Promise.all(
    goals.map(async (g) => {
      let currentProgress = 0;

      if (g.type === 'workouts_per_week') {
        currentProgress = workoutsThisWeek;
      } else if (g.type === 'exercise_target' && g.exerciseId) {
        const record = await prisma.personalRecord.findFirst({
          where: { userId, exerciseId: g.exerciseId, recordType: 'max_weight' },
        });
        currentProgress = record ? Number(record.value) : 0;
      }

      return {
        id: g.id,
        type: g.type,
        targetValue: g.targetValue,
        exerciseId: g.exerciseId,
        exerciseName: g.exercise?.name || null,
        targetWeight: g.targetWeight ? Number(g.targetWeight) : null,
        isActive: g.isActive,
        currentProgress,
        createdAt: g.createdAt.toISOString(),
      };
    })
  );
}

export async function createGoal(userId: string, data: { type: string; targetValue: number; exerciseId?: string; targetWeight?: number }) {
  const goal = await prisma.goal.create({
    data: {
      userId,
      type: data.type as any,
      targetValue: data.targetValue,
      exerciseId: data.exerciseId || null,
      targetWeight: data.targetWeight ?? null,
    },
    include: { exercise: { select: { name: true } } },
  });

  return {
    id: goal.id,
    type: goal.type,
    targetValue: goal.targetValue,
    exerciseId: goal.exerciseId,
    exerciseName: goal.exercise?.name || null,
    targetWeight: goal.targetWeight ? Number(goal.targetWeight) : null,
    isActive: goal.isActive,
    currentProgress: 0,
    createdAt: goal.createdAt.toISOString(),
  };
}

export async function updateGoal(userId: string, goalId: string, data: { targetValue?: number; isActive?: boolean }) {
  const existing = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!existing) throw new AppError('Goal not found', 404);

  await prisma.goal.update({ where: { id: goalId }, data });
}

export async function deleteGoal(userId: string, goalId: string) {
  const existing = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!existing) throw new AppError('Goal not found', 404);
  await prisma.goal.delete({ where: { id: goalId } });
}
