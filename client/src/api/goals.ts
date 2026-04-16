import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { Goal, CreateGoalRequest } from '@workout-app/shared';

async function listGoals(): Promise<Goal[]> {
  const res = await apiClient.get('/goals');
  return res.data;
}

async function createGoal(data: CreateGoalRequest): Promise<Goal> {
  const res = await apiClient.post('/goals', data);
  return res.data;
}

async function updateGoal(id: string, data: Partial<CreateGoalRequest> & { isActive?: boolean }): Promise<Goal> {
  const res = await apiClient.put(`/goals/${id}`, data);
  return res.data;
}

async function deleteGoal(id: string): Promise<void> {
  await apiClient.delete(`/goals/${id}`);
}

export function useGoals() {
  return useQuery({ queryKey: ['goals'], queryFn: listGoals });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateGoalRequest> & { isActive?: boolean } }) =>
      updateGoal(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}
