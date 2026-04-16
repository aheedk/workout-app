import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { Routine, CreateRoutineRequest, Workout } from '@workout-app/shared';

async function listRoutines(): Promise<Routine[]> {
  const res = await apiClient.get('/routines');
  return res.data;
}

async function getRoutine(id: string): Promise<Routine> {
  const res = await apiClient.get(`/routines/${id}`);
  return res.data;
}

async function createRoutine(data: CreateRoutineRequest): Promise<Routine> {
  const res = await apiClient.post('/routines', data);
  return res.data;
}

async function updateRoutine(id: string, data: CreateRoutineRequest): Promise<Routine> {
  const res = await apiClient.put(`/routines/${id}`, data);
  return res.data;
}

async function deleteRoutine(id: string): Promise<void> {
  await apiClient.delete(`/routines/${id}`);
}

async function duplicateRoutine(id: string): Promise<Routine> {
  const res = await apiClient.post(`/routines/${id}/duplicate`);
  return res.data;
}

async function toggleFavorite(id: string): Promise<Routine> {
  const res = await apiClient.patch(`/routines/${id}/favorite`);
  return res.data;
}

async function startWorkoutFromRoutine(id: string): Promise<Workout> {
  const res = await apiClient.post(`/routines/${id}/start`);
  return res.data;
}

export function useRoutines() {
  return useQuery({ queryKey: ['routines'], queryFn: listRoutines });
}

export function useRoutine(id: string | undefined) {
  return useQuery({
    queryKey: ['routine', id],
    queryFn: () => getRoutine(id!),
    enabled: !!id,
  });
}

export function useCreateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRoutine,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
}

export function useUpdateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateRoutineRequest }) => updateRoutine(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['routines'] });
      qc.invalidateQueries({ queryKey: ['routine', id] });
    },
  });
}

export function useDeleteRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRoutine,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
}

export function useDuplicateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: duplicateRoutine,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleFavorite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
}

export function useStartWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startWorkoutFromRoutine,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routines'] });
      qc.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
