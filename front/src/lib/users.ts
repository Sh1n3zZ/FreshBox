import axios from 'axios';
import { API_URLS } from '@/conf/env';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
}

export interface UserListOptions {
  page?: number;
  size?: number;
  keyword?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  size: number;
}

export interface UpdateUserRequest {
  username: string;
  email: string;
  role: string;
  avatar?: string;
}

export const userService = {
  // 获取用户列表（管理员功能）
  async listUsers(options: UserListOptions): Promise<UserListResponse> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.size) params.append('size', options.size.toString());
    if (options.keyword) params.append('keyword', options.keyword);

    const response = await axios.get(`${API_URLS.USER.ADMIN.LIST}?${params.toString()}`);
    return response.data;
  },

  // 更新用户信息（管理员功能）
  async updateUser(id: string, data: UpdateUserRequest): Promise<void> {
    await axios.put(API_URLS.USER.ADMIN.UPDATE(id), data);
  },

  // 删除用户（管理员功能）
  async deleteUser(id: string): Promise<void> {
    await axios.delete(API_URLS.USER.ADMIN.DELETE(id));
  },
};
