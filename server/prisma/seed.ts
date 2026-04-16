import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const exercises = [
  // Chest
  { name: 'Barbell Bench Press', muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'arms'], equipment: 'barbell' },
  { name: 'Incline Barbell Bench Press', muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'arms'], equipment: 'barbell' },
  { name: 'Decline Barbell Bench Press', muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'arms'], equipment: 'barbell' },
  { name: 'Dumbbell Bench Press', muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'arms'], equipment: 'dumbbell' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'arms'], equipment: 'dumbbell' },
  { name: 'Dumbbell Flyes', muscleGroup: 'chest', secondaryMuscles: ['shoulders'], equipment: 'dumbbell' },
  { name: 'Cable Crossover', muscleGroup: 'chest', secondaryMuscles: ['shoulders'], equipment: 'cable' },
  { name: 'Chest Dip', muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'arms'], equipment: 'bodyweight' },
  { name: 'Push-Up', muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'arms', 'core'], equipment: 'bodyweight' },
  { name: 'Machine Chest Press', muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'arms'], equipment: 'machine' },
  { name: 'Pec Deck', muscleGroup: 'chest', secondaryMuscles: [], equipment: 'machine' },

  // Back
  { name: 'Conventional Deadlift', muscleGroup: 'back', secondaryMuscles: ['legs', 'core'], equipment: 'barbell' },
  { name: 'Sumo Deadlift', muscleGroup: 'back', secondaryMuscles: ['legs', 'core'], equipment: 'barbell' },
  { name: 'Barbell Row', muscleGroup: 'back', secondaryMuscles: ['arms'], equipment: 'barbell' },
  { name: 'Pendlay Row', muscleGroup: 'back', secondaryMuscles: ['arms'], equipment: 'barbell' },
  { name: 'Dumbbell Row', muscleGroup: 'back', secondaryMuscles: ['arms'], equipment: 'dumbbell' },
  { name: 'Pull-Up', muscleGroup: 'back', secondaryMuscles: ['arms'], equipment: 'bodyweight' },
  { name: 'Chin-Up', muscleGroup: 'back', secondaryMuscles: ['arms'], equipment: 'bodyweight' },
  { name: 'Lat Pulldown', muscleGroup: 'back', secondaryMuscles: ['arms'], equipment: 'cable' },
  { name: 'Seated Cable Row', muscleGroup: 'back', secondaryMuscles: ['arms'], equipment: 'cable' },
  { name: 'T-Bar Row', muscleGroup: 'back', secondaryMuscles: ['arms'], equipment: 'barbell' },
  { name: 'Face Pull', muscleGroup: 'back', secondaryMuscles: ['shoulders'], equipment: 'cable' },
  { name: 'Rack Pull', muscleGroup: 'back', secondaryMuscles: ['legs'], equipment: 'barbell' },
  { name: 'Machine Row', muscleGroup: 'back', secondaryMuscles: ['arms'], equipment: 'machine' },

  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'shoulders', secondaryMuscles: ['arms', 'core'], equipment: 'barbell' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'shoulders', secondaryMuscles: ['arms'], equipment: 'dumbbell' },
  { name: 'Arnold Press', muscleGroup: 'shoulders', secondaryMuscles: ['arms'], equipment: 'dumbbell' },
  { name: 'Lateral Raise', muscleGroup: 'shoulders', secondaryMuscles: [], equipment: 'dumbbell' },
  { name: 'Cable Lateral Raise', muscleGroup: 'shoulders', secondaryMuscles: [], equipment: 'cable' },
  { name: 'Front Raise', muscleGroup: 'shoulders', secondaryMuscles: [], equipment: 'dumbbell' },
  { name: 'Reverse Flyes', muscleGroup: 'shoulders', secondaryMuscles: ['back'], equipment: 'dumbbell' },
  { name: 'Upright Row', muscleGroup: 'shoulders', secondaryMuscles: ['arms'], equipment: 'barbell' },
  { name: 'Machine Shoulder Press', muscleGroup: 'shoulders', secondaryMuscles: ['arms'], equipment: 'machine' },
  { name: 'Shrugs', muscleGroup: 'shoulders', secondaryMuscles: [], equipment: 'dumbbell' },
  { name: 'Barbell Shrugs', muscleGroup: 'shoulders', secondaryMuscles: [], equipment: 'barbell' },

  // Legs
  { name: 'Barbell Back Squat', muscleGroup: 'legs', secondaryMuscles: ['core'], equipment: 'barbell' },
  { name: 'Front Squat', muscleGroup: 'legs', secondaryMuscles: ['core'], equipment: 'barbell' },
  { name: 'Goblet Squat', muscleGroup: 'legs', secondaryMuscles: ['core'], equipment: 'dumbbell' },
  { name: 'Leg Press', muscleGroup: 'legs', secondaryMuscles: [], equipment: 'machine' },
  { name: 'Hack Squat', muscleGroup: 'legs', secondaryMuscles: [], equipment: 'machine' },
  { name: 'Romanian Deadlift', muscleGroup: 'legs', secondaryMuscles: ['back'], equipment: 'barbell' },
  { name: 'Dumbbell Romanian Deadlift', muscleGroup: 'legs', secondaryMuscles: ['back'], equipment: 'dumbbell' },
  { name: 'Leg Curl', muscleGroup: 'legs', secondaryMuscles: [], equipment: 'machine' },
  { name: 'Leg Extension', muscleGroup: 'legs', secondaryMuscles: [], equipment: 'machine' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'legs', secondaryMuscles: ['core'], equipment: 'dumbbell' },
  { name: 'Walking Lunges', muscleGroup: 'legs', secondaryMuscles: ['core'], equipment: 'dumbbell' },
  { name: 'Hip Thrust', muscleGroup: 'legs', secondaryMuscles: ['core'], equipment: 'barbell' },
  { name: 'Standing Calf Raise', muscleGroup: 'legs', secondaryMuscles: [], equipment: 'machine' },
  { name: 'Seated Calf Raise', muscleGroup: 'legs', secondaryMuscles: [], equipment: 'machine' },
  { name: 'Glute-Ham Raise', muscleGroup: 'legs', secondaryMuscles: ['back'], equipment: 'bodyweight' },
  { name: 'Step-Ups', muscleGroup: 'legs', secondaryMuscles: ['core'], equipment: 'dumbbell' },

  // Arms
  { name: 'Barbell Curl', muscleGroup: 'arms', secondaryMuscles: [], equipment: 'barbell' },
  { name: 'Dumbbell Curl', muscleGroup: 'arms', secondaryMuscles: [], equipment: 'dumbbell' },
  { name: 'Hammer Curl', muscleGroup: 'arms', secondaryMuscles: [], equipment: 'dumbbell' },
  { name: 'Preacher Curl', muscleGroup: 'arms', secondaryMuscles: [], equipment: 'barbell' },
  { name: 'Cable Curl', muscleGroup: 'arms', secondaryMuscles: [], equipment: 'cable' },
  { name: 'Concentration Curl', muscleGroup: 'arms', secondaryMuscles: [], equipment: 'dumbbell' },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'arms', secondaryMuscles: [], equipment: 'dumbbell' },
  { name: 'Tricep Pushdown', muscleGroup: 'arms', secondaryMuscles: [], equipment: 'cable' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'arms', secondaryMuscles: [], equipment: 'cable' },
  { name: 'Skull Crusher', muscleGroup: 'arms', secondaryMuscles: [], equipment: 'barbell' },
  { name: 'Dumbbell Tricep Extension', muscleGroup: 'arms', secondaryMuscles: [], equipment: 'dumbbell' },
  { name: 'Close-Grip Bench Press', muscleGroup: 'arms', secondaryMuscles: ['chest'], equipment: 'barbell' },
  { name: 'Diamond Push-Up', muscleGroup: 'arms', secondaryMuscles: ['chest'], equipment: 'bodyweight' },
  { name: 'Tricep Dip', muscleGroup: 'arms', secondaryMuscles: ['chest', 'shoulders'], equipment: 'bodyweight' },
  { name: 'Wrist Curl', muscleGroup: 'arms', secondaryMuscles: [], equipment: 'barbell' },

  // Core
  { name: 'Plank', muscleGroup: 'core', secondaryMuscles: ['shoulders'], equipment: 'bodyweight' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'core', secondaryMuscles: ['shoulders'], equipment: 'other' },
  { name: 'Hanging Leg Raise', muscleGroup: 'core', secondaryMuscles: [], equipment: 'bodyweight' },
  { name: 'Cable Crunch', muscleGroup: 'core', secondaryMuscles: [], equipment: 'cable' },
  { name: 'Russian Twist', muscleGroup: 'core', secondaryMuscles: [], equipment: 'bodyweight' },
  { name: 'Decline Sit-Up', muscleGroup: 'core', secondaryMuscles: [], equipment: 'bodyweight' },
  { name: 'Dead Bug', muscleGroup: 'core', secondaryMuscles: [], equipment: 'bodyweight' },
  { name: 'Pallof Press', muscleGroup: 'core', secondaryMuscles: [], equipment: 'cable' },
  { name: 'Mountain Climbers', muscleGroup: 'core', secondaryMuscles: ['legs'], equipment: 'bodyweight' },
  { name: 'Bicycle Crunch', muscleGroup: 'core', secondaryMuscles: [], equipment: 'bodyweight' },

  // Cardio
  { name: 'Treadmill Running', muscleGroup: 'cardio', secondaryMuscles: ['legs'], equipment: 'machine' },
  { name: 'Stationary Bike', muscleGroup: 'cardio', secondaryMuscles: ['legs'], equipment: 'machine' },
  { name: 'Rowing Machine', muscleGroup: 'cardio', secondaryMuscles: ['back', 'arms'], equipment: 'machine' },
  { name: 'Stair Climber', muscleGroup: 'cardio', secondaryMuscles: ['legs'], equipment: 'machine' },
  { name: 'Jump Rope', muscleGroup: 'cardio', secondaryMuscles: ['legs', 'shoulders'], equipment: 'other' },
];

async function main() {
  console.log('Seeding exercises...');

  // Seed system exercises
  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { id: ex.name.toLowerCase().replace(/[^a-z0-9]/g, '-') },
      create: {
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        isCustom: false,
      },
      update: {},
    });
  }

  // Use createMany for exercises since upsert with generated IDs is simpler
  const existingCount = await prisma.exercise.count({ where: { isCustom: false } });
  if (existingCount === 0) {
    await prisma.exercise.createMany({
      data: exercises.map((ex) => ({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        isCustom: false,
      })),
      skipDuplicates: true,
    });
  }

  console.log(`Seeded ${exercises.length} exercises`);

  // Create demo user
  const demoPasswordHash = await bcrypt.hash('password123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@workout.app' },
    create: {
      email: 'demo@workout.app',
      passwordHash: demoPasswordHash,
      name: 'Demo User',
      unitPreference: 'lb',
      theme: 'system',
    },
    update: {},
  });

  // Get some exercises for demo data
  const allExercises = await prisma.exercise.findMany({ where: { isCustom: false } });
  const findEx = (name: string) => allExercises.find((e) => e.name === name)!;

  const bench = findEx('Barbell Bench Press');
  const ohp = findEx('Overhead Press');
  const flyes = findEx('Dumbbell Flyes');
  const pushdown = findEx('Tricep Pushdown');
  const deadlift = findEx('Conventional Deadlift');
  const row = findEx('Barbell Row');
  const pullUp = findEx('Pull-Up');
  const curl = findEx('Barbell Curl');
  const squat = findEx('Barbell Back Squat');
  const legPress = findEx('Leg Press');
  const rdl = findEx('Romanian Deadlift');
  const legCurl = findEx('Leg Curl');
  const calfRaise = findEx('Standing Calf Raise');

  // Create demo routines
  const pushRoutine = await prisma.routine.upsert({
    where: { id: 'demo-push' },
    create: {
      id: 'demo-push',
      userId: demoUser.id,
      name: 'Push Day',
      tags: ['push', 'upper'],
      isFavorite: true,
      exercises: {
        create: [
          { exerciseId: bench.id, sortOrder: 0, defaultSets: 4, defaultReps: 8, defaultWeight: 185, restSeconds: 120 },
          { exerciseId: ohp.id, sortOrder: 1, defaultSets: 3, defaultReps: 10, defaultWeight: 95, restSeconds: 90 },
          { exerciseId: flyes.id, sortOrder: 2, defaultSets: 3, defaultReps: 12, defaultWeight: 35, restSeconds: 60 },
          { exerciseId: pushdown.id, sortOrder: 3, defaultSets: 3, defaultReps: 12, defaultWeight: 50, restSeconds: 60 },
        ],
      },
    },
    update: {},
  });

  await prisma.routine.upsert({
    where: { id: 'demo-pull' },
    create: {
      id: 'demo-pull',
      userId: demoUser.id,
      name: 'Pull Day',
      tags: ['pull', 'upper'],
      isFavorite: true,
      exercises: {
        create: [
          { exerciseId: deadlift.id, sortOrder: 0, defaultSets: 3, defaultReps: 5, defaultWeight: 275, restSeconds: 180 },
          { exerciseId: row.id, sortOrder: 1, defaultSets: 4, defaultReps: 8, defaultWeight: 155, restSeconds: 90 },
          { exerciseId: pullUp.id, sortOrder: 2, defaultSets: 3, defaultReps: 8, restSeconds: 90 },
          { exerciseId: curl.id, sortOrder: 3, defaultSets: 3, defaultReps: 12, defaultWeight: 65, restSeconds: 60 },
        ],
      },
    },
    update: {},
  });

  await prisma.routine.upsert({
    where: { id: 'demo-legs' },
    create: {
      id: 'demo-legs',
      userId: demoUser.id,
      name: 'Leg Day',
      tags: ['legs', 'lower'],
      exercises: {
        create: [
          { exerciseId: squat.id, sortOrder: 0, defaultSets: 4, defaultReps: 6, defaultWeight: 225, restSeconds: 180 },
          { exerciseId: legPress.id, sortOrder: 1, defaultSets: 3, defaultReps: 12, defaultWeight: 360, restSeconds: 90 },
          { exerciseId: rdl.id, sortOrder: 2, defaultSets: 3, defaultReps: 10, defaultWeight: 185, restSeconds: 90 },
          { exerciseId: legCurl.id, sortOrder: 3, defaultSets: 3, defaultReps: 12, defaultWeight: 90, restSeconds: 60 },
          { exerciseId: calfRaise.id, sortOrder: 4, defaultSets: 4, defaultReps: 15, defaultWeight: 135, restSeconds: 60 },
        ],
      },
    },
    update: {},
  });

  // Create demo workouts over the past 30 days
  const today = new Date();
  const workoutDays = [];
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    // Workout about 5 days per week
    if (date.getDay() !== 0 && date.getDay() !== 4) {
      workoutDays.push(date);
    }
  }

  const routinePattern = ['push', 'pull', 'legs'];

  for (let i = 0; i < Math.min(workoutDays.length, 20); i++) {
    const date = workoutDays[i];
    const type = routinePattern[i % 3];

    let workoutName: string;
    let exerciseData: { exerciseId: string; sets: { weight: number; reps: number }[] }[];

    if (type === 'push') {
      workoutName = 'Push Day';
      exerciseData = [
        { exerciseId: bench.id, sets: [{ weight: 185 + i, reps: 8 }, { weight: 185 + i, reps: 7 }, { weight: 185 + i, reps: 6 }, { weight: 175, reps: 8 }] },
        { exerciseId: ohp.id, sets: [{ weight: 95, reps: 10 }, { weight: 95, reps: 9 }, { weight: 95, reps: 8 }] },
        { exerciseId: flyes.id, sets: [{ weight: 35, reps: 12 }, { weight: 35, reps: 12 }, { weight: 35, reps: 10 }] },
        { exerciseId: pushdown.id, sets: [{ weight: 50, reps: 12 }, { weight: 50, reps: 12 }, { weight: 50, reps: 10 }] },
      ];
    } else if (type === 'pull') {
      workoutName = 'Pull Day';
      exerciseData = [
        { exerciseId: deadlift.id, sets: [{ weight: 275 + i * 2, reps: 5 }, { weight: 275 + i * 2, reps: 4 }, { weight: 275 + i * 2, reps: 3 }] },
        { exerciseId: row.id, sets: [{ weight: 155, reps: 8 }, { weight: 155, reps: 8 }, { weight: 155, reps: 7 }, { weight: 145, reps: 8 }] },
        { exerciseId: pullUp.id, sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 7 }, { weight: 0, reps: 6 }] },
        { exerciseId: curl.id, sets: [{ weight: 65, reps: 12 }, { weight: 65, reps: 11 }, { weight: 65, reps: 10 }] },
      ];
    } else {
      workoutName = 'Leg Day';
      exerciseData = [
        { exerciseId: squat.id, sets: [{ weight: 225 + i, reps: 6 }, { weight: 225 + i, reps: 5 }, { weight: 225 + i, reps: 5 }, { weight: 215, reps: 6 }] },
        { exerciseId: legPress.id, sets: [{ weight: 360, reps: 12 }, { weight: 360, reps: 11 }, { weight: 360, reps: 10 }] },
        { exerciseId: rdl.id, sets: [{ weight: 185, reps: 10 }, { weight: 185, reps: 10 }, { weight: 185, reps: 9 }] },
        { exerciseId: legCurl.id, sets: [{ weight: 90, reps: 12 }, { weight: 90, reps: 12 }, { weight: 90, reps: 11 }] },
        { exerciseId: calfRaise.id, sets: [{ weight: 135, reps: 15 }, { weight: 135, reps: 15 }, { weight: 135, reps: 14 }, { weight: 135, reps: 12 }] },
      ];
    }

    await prisma.workout.create({
      data: {
        userId: demoUser.id,
        name: workoutName,
        date,
        startedAt: date,
        completedAt: new Date(date.getTime() + 50 * 60000),
        durationMinutes: 45 + Math.floor(Math.random() * 15),
        tags: type === 'push' ? ['push', 'upper'] : type === 'pull' ? ['pull', 'upper'] : ['legs', 'lower'],
        exercises: {
          create: exerciseData.map((ex, idx) => ({
            exerciseId: ex.exerciseId,
            sortOrder: idx,
            sets: {
              create: ex.sets.map((s, sIdx) => ({
                setNumber: sIdx + 1,
                weight: s.weight,
                reps: s.reps,
              })),
            },
          })),
        },
      },
    });
  }

  // Create bodyweight entries
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    if (i % 2 === 0) {
      await prisma.bodyweightLog.upsert({
        where: { userId_date: { userId: demoUser.id, date } },
        create: { userId: demoUser.id, weight: 180 - i * 0.1, date },
        update: {},
      });
    }
  }

  // Create a goal
  await prisma.goal.upsert({
    where: { id: 'demo-goal' },
    create: {
      id: 'demo-goal',
      userId: demoUser.id,
      type: 'workouts_per_week',
      targetValue: 5,
    },
    update: {},
  });

  console.log('Demo data seeded successfully!');
  console.log('Demo login: demo@workout.app / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
