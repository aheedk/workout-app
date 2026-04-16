import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  Workout,
  WorkoutSummary,
  CreateWorkoutRequest,
  CalendarDay,
  PaginatedResponse,
} from '@workout-app/shared';

export interface WorkoutFilters {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

async function listWorkouts(filters: WorkoutFilters): Promise<PaginatedResponse<WorkoutSummary>> {
  const params: Record<string, string> = {};
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  if (filters.search) params.search = filters.search;
  if (filters.tags?.length) params.tags = filters.tags.join(',');
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  const res = await apiClient.get('/workouts', { params });
  return res.data;
}

async function getWorkout(id: string): Promise<Workout> {
  const res = await apiClient.get(`/workouts/${id}`);
  return res.data;
}

async function createWorkout(data: CreateWorkoutRequest): Promise<Workout> {
  const res = await apiClient.post('/workouts', data);
  return res.data;
}

async function updateWorkout(id: string, data: CreateWorkoutRequest): Promise<Workout> {
  const res = await apiClient.put(`/workouts/${id}`, data);
  return res.data;
}

async function deleteWorkout(id: string): Promise<void> {
  await apiClient.delete(`/workouts/${id}`);
}

async function getCalendarData(year: number, month: number): Promise<CalendarDay[]> {
  const res = await apiClient.get(`/workouts/calendar/${year}/${month}`);
  return res.data;
}

export function useWorkouts(filters: WorkoutFilters = {}) {
  return useQuery({
    queryKey: ['workouts', filters],
    queryFn: () => listWorkouts(filters),
  });
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: () => getWorkout(id!),
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWorkout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['records'] });
    },
  });
}

export function useUpdateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateWorkoutRequest }) => updateWorkout(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['workouts'] });
      qc.invalidateQueries({ queryKey: ['workout', id] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['records'] });
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useCalendarData(year: number, month: number) {
  return useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => getCalendarData(year, month),
  });
}
