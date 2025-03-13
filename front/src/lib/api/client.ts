import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getSession, signIn, signOut } from 'next-auth/react';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export class APIClient {
  private static instance: APIClient;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE}/auth/refresh`,
      { refreshToken }
    );
    return response.data;
  }

  private setupInterceptors() {
    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const session = await getSession();
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        if (!originalRequest) {
          return Promise.reject(error);
        }

        // 如果是 401 错误且不是刷新 token 的请求
        if (
          error.response?.status === 401 &&
          originalRequest.url !== '/auth/refresh'
        ) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            const session = await getSession();

            try {
              if (session?.refreshToken) {
                // 尝试刷新 token
                const { accessToken, refreshToken } = await this.refreshToken(
                  session.refreshToken
                );

                // 更新 session
                await signIn('credentials', {
                  accessToken,
                  refreshToken,
                  redirect: false,
                });

                // 通知所有等待的请求
                this.onRefreshed(accessToken);

                // 重试原始请求
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return this.axiosInstance(originalRequest);
              }
            } catch (refreshError) {
              // 刷新失败，清除会话并重定向到登录页
              await signOut({ redirect: true, callbackUrl: '/login' });
              return Promise.reject(refreshError);
            } finally {
              this.isRefreshing = false;
            }
          } else {
            // 等待 token 刷新完成
            return new Promise((resolve) => {
              this.addRefreshSubscriber((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.axiosInstance(originalRequest));
              });
            });
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public get client(): AxiosInstance {
    return this.axiosInstance;
  }
} 