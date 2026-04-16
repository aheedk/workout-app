import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { BodyweightLog, CreateBodyweightRequest } from '@workout-app/shared';

async function listLogs(startDate?: string, endDate?: string): Promise<BodyweightLog[]> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const res = await apiClient.get('/bodyweight', { params });
  return res.data;
}

async function createLog(data: CreateBodyweightRequest): Promise<BodyweightLog> {
  const res = await apiClient.post('/bodyweight', data);
  return res.data;
}

async function deleteLog(id: string): Promise<void> {
  await apiClient.delete(`/bodyweight/${id}`);
}

export function useBodyweightLogs(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['bodyweight', startDate, endDate],
    queryFn: () => listLogs(startDate, endDate),
  });
}

export function useLogBodyweight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLog,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bodyweight'] }),
  });
}

export function useDeleteBodyweight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLog,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bodyweight'] }),
  });
}
