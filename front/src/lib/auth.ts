import axios from 'axios';
import { API_URLS } from '@/conf/env';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  token: string;
}

export interface AuthResponse {
  code: number;
  msg: string;
  data: User;
}

/**
 * 用户登录
 */
export async function loginUser(email: string, password: string): Promise<User> {
  try {
    const response = await axios.post<AuthResponse>(
      API_URLS.USER.LOGIN,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.msg || '登录失败');
    }

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.msg || error.message || '登录失败';
      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * 用户注册
 */
export async function registerUser(email: string, password: string, name: string): Promise<void> {
  try {
    const response = await axios.post<AuthResponse>(
      API_URLS.USER.REGISTER,
      { email, password, name },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.msg || '注册失败');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.msg || error.message || '注册失败';
      throw new Error(errorMessage);
    }
    throw error;
  }
}

// 本地存储相关常量
export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'auth_user';

/**
 * 保存用户信息到本地存储
 */
export function saveUserToLocalStorage(userData: User): void {
  localStorage.setItem(TOKEN_KEY, userData.token);
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

/**
 * 从本地存储中移除用户信息
 */
export function removeUserFromLocalStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * 从本地存储中获取用户信息
 */
export function getUserFromLocalStorage(): User | null {
  const savedUser = localStorage.getItem(USER_KEY);
  const savedToken = localStorage.getItem(TOKEN_KEY);

  if (savedUser && savedToken) {
    try {
      return JSON.parse(savedUser) as User;
    } catch (error) {
      console.error('Failed to parse user data', error);
      return null;
    }
  }

  return null;
}
