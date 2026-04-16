import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { calculateEstimated1RM, calculateVolume } from '../utils/calculations';
import type { CreateWorkoutRequest } from '@workout-app/shared';

function formatWorkout(w: any) {
  return {
    id: w.id,
    routineId: w.routineId,
    name: w.name,
    date: w.date.toISOString().split('T')[0],
    startedAt: w.startedAt.toISOString(),
    completedAt: w.completedAt?.toISOString() || null,
    durationMinutes: w.durationMinutes,
    notes: w.notes,
    tags: w.tags,
    exercises: (w.exercises || []).map((we: any) => ({
      id: we.id,
      exerciseId: we.exerciseId,
      exerciseName: we.exercise.name,
      sortOrder: we.sortOrder,
      notes: we.notes,
      sets: (we.sets || []).map((s: any) => ({
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

const fullInclude = {
  exercises: {
    include: {
      exercise: { select: { name: true } },
      sets: { orderBy: { setNumber: 'asc' as const } },
    },
    orderBy: { sortOrder: 'asc' as const },
  },
};

export async function listWorkouts(
  userId: string,
  opts: { page: number; limit: number; search?: string; tags?: string[]; startDate?: string; endDate?: string }
) {
  const where: any = { userId };

  if (opts.search) {
    where.name = { contains: opts.search, mode: 'insensitive' };
  }
  if (opts.tags?.length) {
    where.tags = { hasSome: opts.tags };
  }
  if (opts.startDate || opts.endDate) {
    where.date = {};
    if (opts.startDate) where.date.gte = new Date(opts.startDate);
    if (opts.endDate) where.date.lte = new Date(opts.endDate);
  }

  const [workouts, total] = await Promise.all([
    prisma.workout.findMany({
      where,
      include: {
        exercises: {
          include: {
            exercise: { select: { name: true } },
            sets: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
    }),
    prisma.workout.count({ where }),
  ]);

  return {
    data: workouts.map((w) => {
      let totalVolume = 0;
      let hasPr = false;
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          if (!s.isWarmup) totalVolume += calculateVolume(s.weight ? Number(s.weight) : null, s.reps);
          if (s.isPr) hasPr = true;
        }
      }
      return {
        id: w.id,
        name: w.name,
        date: w.date.toISOString().split('T')[0],
        durationMinutes: w.durationMinutes,
        tags: w.tags,
        exerciseCount: w.exercises.length,
        totalVolume,
        hasPr,
      };
    }),
    total,
    page: opts.page,
    limit: opts.limit,
    totalPages: Math.ceil(total / opts.limit),
  };
}

export async function getWorkout(userId: string, workoutId: string) {
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId },
    include: fullInclude,
  });

  if (!workout) throw new AppError('Workout not found', 404);
  return formatWorkout(workout);
}

export async function createWorkout(userId: string, data: CreateWorkoutRequest) {
  const workout = await prisma.workout.create({
    data: {
      userId,
      routineId: data.routineId || null,
      name: data.name,
      date: new Date(data.date),
      startedAt: new Date(),
      completedAt: new Date(),
      durationMinutes: data.durationMinutes || null,
      notes: data.notes || null,
      tags: data.tags || [],
      exercises: {
        create: data.exercises.map((e, i) => ({
          exerciseId: e.exerciseId,
          sortOrder: i,
          notes: e.notes || null,
          sets: {
            create: e.sets.map((s, j) => ({
              setNumber: j + 1,
              weight: s.weight ?? null,
              reps: s.reps ?? null,
              rpe: s.rpe ?? null,
              isWarmup: s.isWarmup ?? false,
            })),
          },
        })),
      },
    },
    include: fullInclude,
  });

  // Detect PRs for each exercise
  for (const we of workout.exercises) {
    await detectAndUpdatePRs(userId, we.exerciseId, we.sets, workout.date);
  }

  // Re-fetch to get updated isPr flags
  const updated = await prisma.workout.findUnique({
    where: { id: workout.id },
    include: fullInclude,
  });

  return formatWorkout(updated);
}

export async function updateWorkout(userId: string, workoutId: string, data: CreateWorkoutRequest) {
  const existing = await prisma.workout.findFirst({ where: { id: workoutId, userId } });
  if (!existing) throw new AppError('Workout not found', 404);

  // Delete existing exercises (cascades to sets)
  await prisma.workoutExercise.deleteMany({ where: { workoutId } });

  const workout = await prisma.workout.update({
    where: { id: workoutId },
    data: {
      name: data.name,
      date: new Date(data.date),
      durationMinutes: data.durationMinutes || null,
      notes: data.notes || null,
      tags: data.tags || [],
      exercises: {
        create: data.exercises.map((e, i) => ({
          exerciseId: e.exerciseId,
          sortOrder: i,
          notes: e.notes || null,
          sets: {
            create: e.sets.map((s, j) => ({
              setNumber: j + 1,
              weight: s.weight ?? null,
              reps: s.reps ?? null,
              rpe: s.rpe ?? null,
              isWarmup: s.isWarmup ?? false,
            })),
          },
        })),
      },
    },
    include: fullInclude,
  });

  return formatWorkout(workout);
}

export async function deleteWorkout(userId: string, workoutId: string) {
  const existing = await prisma.workout.findFirst({ where: { id: workoutId, userId } });
  if (!existing) throw new AppError('Workout not found', 404);
  await prisma.workout.delete({ where: { id: workoutId } });
}

export async function getCalendarData(userId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    select: { id: true, date: true },
    orderBy: { date: 'asc' },
  });

  const dayMap = new Map<string, { count: number; ids: string[] }>();
  for (const w of workouts) {
    const key = w.date.toISOString().split('T')[0];
    const entry = dayMap.get(key) || { count: 0, ids: [] };
    entry.count++;
    entry.ids.push(w.id);
    dayMap.set(key, entry);
  }

  return Array.from(dayMap.entries()).map(([date, { count, ids }]) => ({
    date,
    workoutCount: count,
    workoutIds: ids,
  }));
}

async function detectAndUpdatePRs(userId: string, exerciseId: string, sets: any[], workoutDate: Date) {
  for (const set of sets) {
    if (set.isWarmup) continue;
    const weight = set.weight ? Number(set.weight) : 0;
    const reps = set.reps || 0;
    if (weight === 0 && reps === 0) continue;

    const volume = calculateVolume(weight, reps);
    const est1rm = calculateEstimated1RM(weight, reps);

    const checks = [
      { type: 'max_weight' as const, value: weight },
      { type: 'max_reps' as const, value: reps },
      { type: 'max_volume' as const, value: volume },
      { type: 'est_1rm' as const, value: est1rm },
    ];

    for (const check of checks) {
      if (check.value <= 0) continue;

      const existing = await prisma.personalRecord.findFirst({
        where: { userId, exerciseId, recordType: check.type },
      });

      if (!existing || check.value > Number(existing.value)) {
        await prisma.personalRecord.upsert({
          where: existing ? { id: existing.id } : { id: 'non-existent' },
          create: {
            userId,
            exerciseId,
            workoutSetId: set.id,
            recordType: check.type,
            value: check.value,
            achievedAt: workoutDate,
          },
          update: {
            workoutSetId: set.id,
            value: check.value,
            achievedAt: workoutDate,
          },
        });

        // Mark set as PR
        await prisma.workoutSet.update({
          where: { id: set.id },
          data: { isPr: true },
        });
      }
    }
  }
}
