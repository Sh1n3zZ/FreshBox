import axios from 'axios';
import { TOKEN_KEY } from './auth';

/**
 * 初始化全局 axios 拦截器
 * 这个函数在应用程序启动时调用，为所有 axios 请求添加认证头
 */
export function setupAxiosInterceptors() {
  console.log('Setting up axios interceptors');
  
  // 添加请求拦截器
  axios.interceptors.request.use(
    (config) => {
      // 从本地存储获取访问令牌
      const token = localStorage.getItem(TOKEN_KEY);
      
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
  
  // 也可以添加响应拦截器处理401等错误
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response && error.response.status === 401) {
        // 可以在这里处理401错误，例如重定向到登录页面
        console.error('认证失败，请重新登录');
        // 重定向逻辑可以放在这里
      }
      return Promise.reject(error);
    }
  );
} 