import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import type { CreateRoutineRequest } from '@workout-app/shared';

function formatRoutine(r: any) {
  return {
    id: r.id,
    name: r.name,
    tags: r.tags,
    isFavorite: r.isFavorite,
    lastUsedAt: r.lastUsedAt?.toISOString() || null,
    exercises: (r.exercises || []).map((e: any) => ({
      id: e.id,
      exerciseId: e.exerciseId,
      exerciseName: e.exercise.name,
      sortOrder: e.sortOrder,
      defaultSets: e.defaultSets,
      defaultReps: e.defaultReps,
      defaultWeight: e.defaultWeight ? Number(e.defaultWeight) : null,
      restSeconds: e.restSeconds,
    })),
    createdAt: r.createdAt.toISOString(),
  };
}

const includeExercises = {
  exercises: {
    include: { exercise: { select: { name: true } } },
    orderBy: { sortOrder: 'asc' as const },
  },
};

export async function listRoutines(userId: string) {
  const routines = await prisma.routine.findMany({
    where: { userId },
    include: includeExercises,
    orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
  });

  return routines.map(formatRoutine);
}

export async function getRoutine(userId: string, routineId: string) {
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
    include: includeExercises,
  });

  if (!routine) throw new AppError('Routine not found', 404);
  return formatRoutine(routine);
}

export async function createRoutine(userId: string, data: CreateRoutineRequest) {
  const routine = await prisma.routine.create({
    data: {
      userId,
      name: data.name,
      tags: data.tags || [],
      exercises: {
        create: data.exercises.map((e, i) => ({
          exerciseId: e.exerciseId,
          sortOrder: i,
          defaultSets: e.defaultSets ?? 3,
          defaultReps: e.defaultReps ?? 10,
          defaultWeight: e.defaultWeight ?? null,
          restSeconds: e.restSeconds ?? 90,
        })),
      },
    },
    include: includeExercises,
  });

  return formatRoutine(routine);
}

export async function updateRoutine(userId: string, routineId: string, data: CreateRoutineRequest) {
  const existing = await prisma.routine.findFirst({ where: { id: routineId, userId } });
  if (!existing) throw new AppError('Routine not found', 404);

  // Delete existing exercises and replace
  await prisma.routineExercise.deleteMany({ where: { routineId } });

  const routine = await prisma.routine.update({
    where: { id: routineId },
    data: {
      name: data.name,
      tags: data.tags || [],
      exercises: {
        create: data.exercises.map((e, i) => ({
          exerciseId: e.exerciseId,
          sortOrder: i,
          defaultSets: e.defaultSets ?? 3,
          defaultReps: e.defaultReps ?? 10,
          defaultWeight: e.defaultWeight ?? null,
          restSeconds: e.restSeconds ?? 90,
        })),
      },
    },
    include: includeExercises,
  });

  return formatRoutine(routine);
}

export async function deleteRoutine(userId: string, routineId: string) {
  const existing = await prisma.routine.findFirst({ where: { id: routineId, userId } });
  if (!existing) throw new AppError('Routine not found', 404);
  await prisma.routine.delete({ where: { id: routineId } });
}

export async function duplicateRoutine(userId: string, routineId: string) {
  const original = await prisma.routine.findFirst({
    where: { id: routineId, userId },
    include: { exercises: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!original) throw new AppError('Routine not found', 404);

  const routine = await prisma.routine.create({
    data: {
      userId,
      name: `${original.name} (copy)`,
      tags: original.tags,
      exercises: {
        create: original.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          sortOrder: e.sortOrder,
          defaultSets: e.defaultSets,
          defaultReps: e.defaultReps,
          defaultWeight: e.defaultWeight,
          restSeconds: e.restSeconds,
        })),
      },
    },
    include: includeExercises,
  });

  return formatRoutine(routine);
}

export async function toggleFavorite(userId: string, routineId: string) {
  const routine = await prisma.routine.findFirst({ where: { id: routineId, userId } });
  if (!routine) throw new AppError('Routine not found', 404);

  const updated = await prisma.routine.update({
    where: { id: routineId },
    data: { isFavorite: !routine.isFavorite },
    include: includeExercises,
  });

  return formatRoutine(updated);
}

export async function startWorkout(userId: string, routineId: string) {
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
    include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: 'asc' } } },
  });

  if (!routine) throw new AppError('Routine not found', 404);

  const now = new Date();
  const workout = await prisma.workout.create({
    data: {
      userId,
      routineId,
      name: routine.name,
      date: now,
      startedAt: now,
      tags: routine.tags,
      exercises: {
        create: routine.exercises.map((re, i) => ({
          exerciseId: re.exerciseId,
          sortOrder: i,
          sets: {
            create: Array.from({ length: re.defaultSets }, (_, j) => ({
              setNumber: j + 1,
              weight: re.defaultWeight,
              reps: re.defaultReps,
            })),
          },
        })),
      },
    },
    include: {
      exercises: {
        include: {
          exercise: { select: { name: true } },
          sets: { orderBy: { setNumber: 'asc' } },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  // Update lastUsedAt on routine
  await prisma.routine.update({ where: { id: routineId }, data: { lastUsedAt: now } });

  return {
    id: workout.id,
    routineId: workout.routineId,
    name: workout.name,
    date: workout.date.toISOString().split('T')[0],
    startedAt: workout.startedAt.toISOString(),
    completedAt: null,
    durationMinutes: null,
    notes: null,
    tags: workout.tags,
    exercises: workout.exercises.map((we) => ({
      id: we.id,
      exerciseId: we.exerciseId,
      exerciseName: we.exercise.name,
      sortOrder: we.sortOrder,
      notes: we.notes,
      sets: we.sets.map((s) => ({
        id: s.id,
        setNumber: s.setNumber,
        weight: s.weight ? Number(s.weight) : null,
        reps: s.reps,
        rpe: s.rpe ? Number(s.rpe) : null,
        isWarmup: s.isWarmup,
        isPr: s.isPr,
      })),
    })),
  };
}
