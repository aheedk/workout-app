import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  Exercise,
  CreateExerciseRequest,
  ExerciseHistory,
  PersonalRecord,
  MuscleGroup,
} from '@workout-app/shared';

async function listExercises(muscleGroup?: MuscleGroup): Promise<Exercise[]> {
  const params: Record<string, string> = {};
  if (muscleGroup) params.muscleGroup = muscleGroup;
  const res = await apiClient.get('/exercises', { params });
  return res.data;
}

async function createExercise(data: CreateExerciseRequest): Promise<Exercise> {
  const res = await apiClient.post('/exercises', data);
  return res.data;
}

async function getExerciseHistory(id: string): Promise<ExerciseHistory[]> {
  const res = await apiClient.get(`/exercises/${id}/history`);
  return res.data;
}

async function getExerciseRecords(id: string): Promise<PersonalRecord[]> {
  const res = await apiClient.get(`/exercises/${id}/records`);
  return res.data;
}

async function getAllRecords(): Promise<PersonalRecord[]> {
  const res = await apiClient.get('/records');
  return res.data;
}

export function useExercises(muscleGroup?: MuscleGroup) {
  return useQuery({
    queryKey: ['exercises', muscleGroup],
    queryFn: () => listExercises(muscleGroup),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createExercise,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  });
}

export function useExerciseHistory(id: string | undefined) {
  return useQuery({
    queryKey: ['exercise-history', id],
    queryFn: () => getExerciseHistory(id!),
    enabled: !!id,
  });
}

export function useExerciseRecords(id: string | undefined) {
  return useQuery({
    queryKey: ['exercise-records', id],
    queryFn: () => getExerciseRecords(id!),
    enabled: !!id,
  });
}

export function useAllRecords() {
  return useQuery({ queryKey: ['records'], queryFn: getAllRecords });
}

export interface BackfillResult {
  workoutsScanned: number;
  newPrs: number;
  totalPrs: number;
}

async function backfillRecords(): Promise<BackfillResult> {
  const res = await apiClient.post('/records/backfill');
  return res.data;
}

export function useBackfillRecords() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: backfillRecords,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records'] });
      qc.invalidateQueries({ queryKey: ['exercise-records'] });
      qc.invalidateQueries({ queryKey: ['exercise-history'] });
      qc.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
