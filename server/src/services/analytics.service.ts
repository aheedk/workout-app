import { prisma } from '../utils/prisma';
import { calculateVolume } from '../utils/calculations';

export async function getSummary(userId: string) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [weekWorkouts, monthWorkouts, recentWorkout] = await Promise.all([
    prisma.workout.findMany({
      where: { userId, date: { gte: startOfWeek } },
      include: { exercises: { include: { sets: true } } },
    }),
    prisma.workout.findMany({
      where: { userId, date: { gte: startOfMonth } },
      include: { exercises: { include: { sets: true } } },
    }),
    prisma.workout.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { id: true, name: true, date: true },
    }),
  ]);

  const volumeCalc = (workouts: typeof weekWorkouts) => {
    let total = 0;
    for (const w of workouts) {
      for (const e of w.exercises) {
        for (const s of e.sets) {
          if (!s.isWarmup) total += calculateVolume(s.weight ? Number(s.weight) : null, s.reps);
        }
      }
    }
    return total;
  };

  const allDurations = monthWorkouts
    .filter((w) => w.durationMinutes !== null)
    .map((w) => w.durationMinutes!);
  const avgDuration = allDurations.length > 0 ? Math.round(allDurations.reduce((a: number, b: number) => a + b, 0) / allDurations.length) : 0;

  return {
    workoutsThisWeek: weekWorkouts.length,
    workoutsThisMonth: monthWorkouts.length,
    totalVolumeThisWeek: volumeCalc(weekWorkouts),
    totalVolumeThisMonth: volumeCalc(monthWorkouts),
    avgDurationMinutes: avgDuration,
    recentWorkout: recentWorkout
      ? { id: recentWorkout.id, name: recentWorkout.name, date: recentWorkout.date.toISOString().split('T')[0] }
      : null,
  };
}

export async function getStreaks(userId: string) {
  const workouts = await prisma.workout.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: 'desc' },
  });

  if (workouts.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null };
  }

  const dateSet = new Set<string>();
  for (const w of workouts) {
    dateSet.add(w.date.toISOString().split('T')[0]);
  }
  const dates = [...dateSet].sort().reverse();

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 1;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const isActive = dates[0] === today || dates[0] === yesterday;

  const sortedDates = [...dates].reverse();
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;

    if (diff === 1) {
      streak++;
    } else {
      longestStreak = Math.max(longestStreak, streak);
      streak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, streak);

  if (isActive) {
    currentStreak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const curr = new Date(dates[i]);
      const next = new Date(dates[i + 1]);
      const diff = (curr.getTime() - next.getTime()) / 86400000;
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastWorkoutDate: dates[0],
  };
}

export async function getVolume(userId: string, weeks: number = 12) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const workouts = await prisma.workout.findMany({
    where: { userId, date: { gte: startDate } },
    include: { exercises: { include: { sets: true } } },
    orderBy: { date: 'asc' },
  });

  const volumeByDate = new Map<string, number>();
  for (const w of workouts) {
    const dateKey = w.date.toISOString().split('T')[0];
    let vol = volumeByDate.get(dateKey) || 0;
    for (const e of w.exercises) {
      for (const s of e.sets) {
        if (!s.isWarmup) vol += calculateVolume(s.weight ? Number(s.weight) : null, s.reps);
      }
    }
    volumeByDate.set(dateKey, vol);
  }

  return Array.from(volumeByDate.entries()).map(([date, volume]) => ({ date, volume }));
}

export async function getMuscleGroups(userId: string) {
  const workoutExercises = await prisma.workoutExercise.findMany({
    where: { workout: { userId } },
    include: { exercise: { select: { muscleGroup: true } } },
  });

  const counts = new Map<string, number>();
  for (const we of workoutExercises) {
    const mg = we.exercise.muscleGroup;
    counts.set(mg, (counts.get(mg) || 0) + 1);
  }

  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);

  return Array.from(counts.entries())
    .map(([muscleGroup, count]) => ({
      muscleGroup,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getFrequency(userId: string, weeks: number = 12) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const workouts = await prisma.workout.findMany({
    where: { userId, date: { gte: startDate } },
    select: { date: true },
    orderBy: { date: 'asc' },
  });

  const weekMap = new Map<string, number>();
  for (const w of workouts) {
    const d = new Date(w.date);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const key = startOfWeek.toISOString().split('T')[0];
    weekMap.set(key, (weekMap.get(key) || 0) + 1);
  }

  return Array.from(weekMap.entries()).map(([week, count]) => ({ week, count }));
}
