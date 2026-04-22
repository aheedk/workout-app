import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function listExercises(userId: string, muscleGroup?: string) {
  const where: any = {
    OR: [{ userId: null }, { userId }],
  };
  if (muscleGroup) where.muscleGroup = muscleGroup;

  const exercises = await prisma.exercise.findMany({
    where,
    orderBy: [{ isCustom: 'asc' }, { name: 'asc' }],
  });

  return exercises.map((e) => ({
    id: e.id,
    userId: e.userId,
    name: e.name,
    muscleGroup: e.muscleGroup,
    secondaryMuscles: e.secondaryMuscles,
    equipment: e.equipment,
    isCustom: e.isCustom,
  }));
}

export async function createExercise(userId: string, data: { name: string; muscleGroup: string; secondaryMuscles?: string[]; equipment?: string }) {
  const exercise = await prisma.exercise.create({
    data: {
      userId,
      name: data.name,
      muscleGroup: data.muscleGroup,
      secondaryMuscles: data.secondaryMuscles || [],
      equipment: data.equipment || null,
      isCustom: true,
    },
  });

  return exercise;
}

export async function updateExercise(userId: string, exerciseId: string, data: { name?: string; muscleGroup?: string; secondaryMuscles?: string[]; equipment?: string }) {
  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!exercise) throw new AppError('Exercise not found', 404);
  if (exercise.userId !== userId) throw new AppError('Cannot modify system exercises', 403);

  return prisma.exercise.update({ where: { id: exerciseId }, data });
}

export async function deleteExercise(userId: string, exerciseId: string) {
  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!exercise) throw new AppError('Exercise not found', 404);
  if (exercise.userId !== userId) throw new AppError('Cannot delete system exercises', 403);

  await prisma.exercise.delete({ where: { id: exerciseId } });
}

export async function getExerciseHistory(userId: string, exerciseId: string, page: number, limit: number) {
  const workoutExercises = await prisma.workoutExercise.findMany({
    where: {
      exerciseId,
      workout: { userId },
    },
    include: {
      workout: { select: { id: true, name: true, date: true } },
      sets: { orderBy: { setNumber: 'asc' } },
    },
    orderBy: { workout: { date: 'desc' } },
    skip: (page - 1) * limit,
    take: limit,
  });

  return workoutExercises.map((we) => ({
    workoutId: we.workout.id,
    date: we.workout.date.toISOString().split('T')[0],
    workoutName: we.workout.name,
    sets: we.sets.map((s) => ({
      setNumber: s.setNumber,
      weight: s.weight ? Number(s.weight) : null,
      reps: s.reps,
      rpe: s.rpe ? Number(s.rpe) : null,
      isWarmup: s.isWarmup,
      isDropset: s.isDropset,
      isPr: s.isPr,
    })),
  }));
}

export async function getExerciseRecords(userId: string, exerciseId: string) {
  const records = await prisma.personalRecord.findMany({
    where: { userId, exerciseId },
    include: { exercise: { select: { name: true } } },
    orderBy: { achievedAt: 'desc' },
  });

  return records.map((r) => ({
    id: r.id,
    exerciseId: r.exerciseId,
    exerciseName: r.exercise.name,
    recordType: r.recordType,
    value: Number(r.value),
    achievedAt: r.achievedAt.toISOString().split('T')[0],
  }));
}

export async function getAllRecords(userId: string) {
  const records = await prisma.personalRecord.findMany({
    where: { userId },
    include: { exercise: { select: { name: true } } },
    orderBy: { achievedAt: 'desc' },
  });

  return records.map((r) => ({
    id: r.id,
    exerciseId: r.exerciseId,
    exerciseName: r.exercise.name,
    recordType: r.recordType,
    value: Number(r.value),
    achievedAt: r.achievedAt.toISOString().split('T')[0],
  }));
}
