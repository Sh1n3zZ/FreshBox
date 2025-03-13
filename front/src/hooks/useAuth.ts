import { useState, useRef } from 'react';
import { APIClient } from '@/lib/api/client';
import type { LoginResponse, RegisterRequest } from '@/lib/contracts/auth';
import axios, { AxiosError, CanceledError } from 'axios';

// 定义错误信息映射
const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查您的网络设置',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  SERVER_ERROR: '服务器错误，请稍后重试',
  CANCELED: '请求已取消',
  // 业务错误码映射
  AUTH_INVALID_CREDENTIALS: '邮箱或密码错误',
  AUTH_USER_NOT_FOUND: '用户不存在',
  AUTH_USER_EXISTS: '该邮箱已被注册',
  AUTH_INVALID_TOKEN: '登录已过期，请重新登录',
  DEFAULT: '操作失败，请重试',
} as const;

interface ApiErrorResponse {
  code: string;
  message: string;
  field?: string;
}

export class CustomAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string
  ) {
    super(message);
    this.name = 'CustomAuthError';
  }
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const client = APIClient.getInstance();
  const abortControllerRef = useRef<AbortController | null>(null);

  // 处理错误的通用函数
  const handleError = (error: unknown): never => {
    if (error instanceof CanceledError) {
      throw new CustomAuthError(ERROR_MESSAGES.CANCELED, 'REQUEST_CANCELED');
    }

    if (error instanceof AxiosError) {
      // 网络错误
      if (!error.response) {
        throw new CustomAuthError(ERROR_MESSAGES.NETWORK_ERROR, 'NETWORK_ERROR');
      }

      // 超时错误
      if (error.code === 'ECONNABORTED') {
        throw new CustomAuthError(ERROR_MESSAGES.TIMEOUT_ERROR, 'TIMEOUT_ERROR');
      }

      // 服务器返回的业务错误
      const data = error.response.data as ApiErrorResponse;
      if (data?.code) {
        const message = ERROR_MESSAGES[data.code as keyof typeof ERROR_MESSAGES] || data.message;
        throw new CustomAuthError(message, data.code, data.field);
      }

      // 服务器错误（500等）
      if (error.response.status >= 500) {
        throw new CustomAuthError(ERROR_MESSAGES.SERVER_ERROR, 'SERVER_ERROR');
      }
    }

    // 其他未知错误
    throw new CustomAuthError(ERROR_MESSAGES.DEFAULT, 'UNKNOWN_ERROR');
  };

  // 取消当前请求
  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      setIsLoading(true);
      // 创建新的 AbortController
      cancelRequest();
      abortControllerRef.current = new AbortController();

      const response = await client.client.post<LoginResponse>(
        '/auth/login',
        { email, password },
        {
          signal: abortControllerRef.current.signal,
          timeout: 10000, // 10 秒超时
        }
      );

      return response.data;
    } catch (error) {
      throw handleError(error);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    try {
      setIsLoading(true);
      // 创建新的 AbortController
      cancelRequest();
      abortControllerRef.current = new AbortController();

      const data: RegisterRequest = {
        username,
        email,
        password,
      };

      const response = await client.client.post<LoginResponse>(
        '/auth/register',
        data,
        {
          signal: abortControllerRef.current.signal,
          timeout: 10000, // 10 秒超时
        }
      );

      return response.data;
    } catch (error) {
      throw handleError(error);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return {
    login,
    register,
    isLoading,
    cancelRequest,
  };
} 