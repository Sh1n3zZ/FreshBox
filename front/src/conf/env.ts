/**
 * 环境配置文件
 * 包含后端API URL及其他环境相关配置
 */

// 环境类型
export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

// 获取当前环境
export const getCurrentEnvironment = (): Environment => {
  const env = import.meta.env.MODE || 'development';
  
  if (env === 'production') {
    return Environment.Production;
  } else if (env === 'test') {
    return Environment.Test;
  }
  
  return Environment.Development;
};

export const CUSTOM_API_ENDPOINT_KEY = 'custom_api_endpoint';

export const getCustomApiEndpoint = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CUSTOM_API_ENDPOINT_KEY);
};

export const setCustomApiEndpoint = (endpoint: string | null): void => {
  if (typeof window === 'undefined') return;
  
  if (endpoint) {
    const formattedEndpoint = endpoint.endsWith('/') 
      ? endpoint.slice(0, -1) 
      : endpoint;
    
    localStorage.setItem(CUSTOM_API_ENDPOINT_KEY, formattedEndpoint);
  } else {
    localStorage.removeItem(CUSTOM_API_ENDPOINT_KEY);
  }
};

export const clearCustomApiEndpoint = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CUSTOM_API_ENDPOINT_KEY);
};

// 环境配置接口
interface EnvironmentConfig {
  apiBaseUrl: string;
  ocrApiUrl: string;
  imageBaseUrl: string;
  socketUrl: string;
  timeout: number;
}

// 环境配置映射
const envConfigs: Record<Environment, EnvironmentConfig> = {
  [Environment.Development]: {
    apiBaseUrl: 'http://localhost:8080/api/v1',
    ocrApiUrl: 'http://localhost:8080/api/v1/ocr',
    imageBaseUrl: 'http://localhost:8080/static',
    socketUrl: 'ws://localhost:8080/ws',
    timeout: 30000, // 30秒
  },
  [Environment.Production]: {
    apiBaseUrl: '/api/v1',
    ocrApiUrl: '/api/v1/ocr',
    imageBaseUrl: '/static',
    socketUrl: 'ws://freshbox.example.com/ws',
    timeout: 60000, // 60秒
  },
  [Environment.Test]: {
    apiBaseUrl: 'http://test-api.example.com/api/v1',
    ocrApiUrl: 'http://test-api.example.com/api/v1/ocr',
    imageBaseUrl: 'http://test-api.example.com/static',
    socketUrl: 'ws://test-api.example.com/ws',
    timeout: 30000,
  },
};

// 获取当前环境配置
const currentEnv = getCurrentEnvironment();
const config = {...envConfigs[currentEnv]};

// 应用自定义API端点（如果存在）
const customApiEndpoint = getCustomApiEndpoint();
if (customApiEndpoint) {
  config.apiBaseUrl = `${customApiEndpoint}/api/v1`;
  config.ocrApiUrl = `${customApiEndpoint}/api/v1/ocr`;
  
  // 如果是本地或测试环境，也更新静态资源和WebSocket的URL
  if (currentEnv !== Environment.Production) {
    const wsProtocol = customApiEndpoint.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = customApiEndpoint.replace(/^https?:\/\//, '');
    
    config.imageBaseUrl = `${customApiEndpoint}/static`;
    config.socketUrl = `${wsProtocol}://${baseUrl}/ws`;
  }
}

export { config };

// API URL常量
export const API_URLS = {
  // 通用API
  BASE: config.apiBaseUrl,
  UPLOAD: `${config.apiBaseUrl}/upload`,
  
  // OCR相关API
  OCR: {
    PROCESS: `${config.ocrApiUrl}/process`,
    BATCH: `${config.ocrApiUrl}/batch`,
    SAVE: `${config.ocrApiUrl}/save`,
  },
  
  // 用户相关API
  USER: {
    LOGIN: `${config.apiBaseUrl}/auth/login`,
    REGISTER: `${config.apiBaseUrl}/auth/register`,
    REFRESH_TOKEN: `${config.apiBaseUrl}/auth/refresh`,
    PROFILE: `${config.apiBaseUrl}/user/profile`,
  },
  
  // 盲盒相关API
  BOX: {
    LIST: `${config.apiBaseUrl}/boxes`,
    DETAIL: (id: string) => `${config.apiBaseUrl}/boxes/${id}`,
    CREATE: `${config.apiBaseUrl}/boxes`,
    UPDATE: (id: string) => `${config.apiBaseUrl}/boxes/${id}`,
    DELETE: (id: string) => `${config.apiBaseUrl}/boxes/${id}`,
    PURCHASE: (id: string) => `${config.apiBaseUrl}/boxes/${id}/purchase`,
  },
  
  // 任务相关API
  TASK: {
    LIST: `${config.apiBaseUrl}/tasks`,
    DETAIL: (id: string) => `${config.apiBaseUrl}/tasks/${id}`,
    CREATE: `${config.apiBaseUrl}/tasks`,
    RECOMMENDED: `${config.apiBaseUrl}/tasks/recommended`,
    POPULAR: `${config.apiBaseUrl}/tasks/popular`,
    PROGRESS: (id: string) => `${config.apiBaseUrl}/tasks/${id}/progress`,
    CONTENTS: (id: string) => `${config.apiBaseUrl}/tasks/${id}/contents`,
    UPDATE_STATUS: (id: string) => `${config.apiBaseUrl}/tasks/${id}/status`,
    UPLOAD_CONTENT: (id: string) => `${config.apiBaseUrl}/tasks/${id}/content`,
  },
  
  // 仪表盘相关API
  DASHBOARD: {
    SUMMARY: `${config.apiBaseUrl}/dashboard/summary`,
    REVENUE: `${config.apiBaseUrl}/dashboard/revenue`,
    CATEGORIES: `${config.apiBaseUrl}/dashboard/categories`,
    USER_ACTIVITY: `${config.apiBaseUrl}/dashboard/user-activity`,
    DONATIONS: `${config.apiBaseUrl}/dashboard/donations`,
    RECENT_BOXES: `${config.apiBaseUrl}/dashboard/recent-boxes`,
    TOP_TASKS: `${config.apiBaseUrl}/dashboard/top-tasks`,
  },
};

// 图片URL构建函数
export const getImageUrl = (path: string): string => {
  if (path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }
  
  const trimmedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${config.imageBaseUrl}/${trimmedPath}`;
};

// 导出实用函数
export default {
  isProduction: currentEnv === Environment.Production,
  isDevelopment: currentEnv === Environment.Development,
  isTest: currentEnv === Environment.Test,
  config,
  API_URLS,
  getImageUrl,
  getCustomApiEndpoint,
  setCustomApiEndpoint,
  clearCustomApiEndpoint,
};
