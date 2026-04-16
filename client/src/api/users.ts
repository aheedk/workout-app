import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { User, UpdateProfileRequest, ChangePasswordRequest } from '@workout-app/shared';

async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const res = await apiClient.put('/users/me', data);
  return res.data;
}

async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await apiClient.put('/users/me/password', data);
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user'] }),
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}
