import apiClient from '@/lib/api';
import { API_URLS } from '@/conf/env';

// Upload user avatar
export async function uploadUserAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('type', 'user');

  const response = await apiClient.post(API_URLS.UPLOAD.WITH_TYPE('user'), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data.url;
}

// Update user profile
export async function updateUserProfile(profileData: any) {
  return apiClient.put(API_URLS.USER.PROFILE, profileData);
}

// Get user profile
export async function getUserProfile() {
  return apiClient.get(API_URLS.USER.PROFILE);
}
