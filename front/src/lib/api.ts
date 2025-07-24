import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_URLS } from '@/conf/env';

// 创建一个 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URLS.BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 从本地存储获取访问令牌
    const token = localStorage.getItem('access_token');
    
    // 如果令牌存在且请求头已存在，则将令牌添加到 Authorization 头中
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 导出通用请求方法
export const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config).then(response => response.data),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config).then(response => response.data),
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config).then(response => response.data),
  
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config).then(response => response.data),
};

// 获取当前用户信息
export function getUserProfile() {
  return apiClient.get('/user/profile');
}

// 更新当前用户信息
export function updateUserProfile(data: any) {
  return apiClient.put('/user/profile', data);
}

// 导出原始实例，用于特殊场景
export default apiClient; 