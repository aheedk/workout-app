import { useQuery } from '@tanstack/react-query';
import apiClient from './client';
import type {
  AnalyticsSummary,
  StreakData,
  VolumeDataPoint,
  MuscleGroupData,
  FrequencyDataPoint,
} from '@workout-app/shared';

export function useSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async (): Promise<AnalyticsSummary> => {
      const res = await apiClient.get('/analytics/summary');
      return res.data;
    },
  });
}

export function useStreaks() {
  return useQuery({
    queryKey: ['analytics', 'streaks'],
    queryFn: async (): Promise<StreakData> => {
      const res = await apiClient.get('/analytics/streaks');
      return res.data;
    },
  });
}

export function useVolume(weeks = 12) {
  return useQuery({
    queryKey: ['analytics', 'volume', weeks],
    queryFn: async (): Promise<VolumeDataPoint[]> => {
      const res = await apiClient.get('/analytics/volume', { params: { weeks } });
      return res.data;
    },
  });
}

export function useMuscleGroups() {
  return useQuery({
    queryKey: ['analytics', 'muscle-groups'],
    queryFn: async (): Promise<MuscleGroupData[]> => {
      const res = await apiClient.get('/analytics/muscle-groups');
      return res.data;
    },
  });
}

export function useFrequency(weeks = 12) {
  return useQuery({
    queryKey: ['analytics', 'frequency', weeks],
    queryFn: async (): Promise<FrequencyDataPoint[]> => {
      const res = await apiClient.get('/analytics/frequency', { params: { weeks } });
      return res.data;
    },
  });
}
