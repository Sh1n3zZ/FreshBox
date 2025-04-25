import axios from 'axios';
import { API_URLS } from '@/conf/env';

export interface User {
  user_id: string;
  username: string;
  email: string;
  avatar?: string;
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  code: number;
  msg: string;
  data: User;
}

/**
 * 发送验证码
 */
export async function sendVerificationCode(email: string): Promise<void> {
  try {
    const response = await axios.post<AuthResponse>(
      API_URLS.AUTH.SEND_CODE,
      { email },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.msg || '发送验证码失败');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.msg || error.message || '发送验证码失败';
      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * 用户注册
 */
export async function registerUser(username: string, email: string, password: string, code: string): Promise<User> {
  try {
    console.log('发送注册请求:', { username, email, password: '******', code })
    
    const response = await axios.post(
      API_URLS.AUTH.REGISTER,
      { username, email, password, code },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('注册响应:', response.data)

    // 检查响应结构，处理两种可能的格式
    let userData: User;
    
    if (response.data.code !== undefined) {
      // 标准AuthResponse格式
      if (response.data.code !== 200) {
        throw new Error(response.data.msg || '注册失败');
      }
      userData = response.data.data;
    } else {
      // 直接返回用户数据对象
      userData = response.data;
    }

    // 验证返回的用户数据是否包含必要的字段
    if (!userData || !userData.access_token || !userData.refresh_token) {
      console.error('注册响应缺少必要的token信息:', userData)
      throw new Error('服务器返回数据格式异常');
    }

    return userData;
  } catch (error) {
    console.error('注册失败:', error)
    
    if (axios.isAxiosError(error)) {
      // 处理网络错误
      if (!error.response) {
        throw new Error('网络连接失败，请检查网络设置');
      }
      
      // 处理HTTP状态码异常的情况
      if (error.response.status !== 200) {
        // 尝试从不同的响应结构中获取错误信息
        const errorData = error.response.data;
        let errorMessage = '注册失败';
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.msg) {
          errorMessage = errorData.msg;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        throw new Error(errorMessage);
      }
      
      throw new Error('注册失败：' + (error.message || '未知错误'));
    }
    throw error;
  }
}

/**
 * 用户登录
 */
export async function loginUser(login: string, password: string): Promise<User> {
  try {
    console.log('发送登录请求:', { login, password: '******' })
    
    const response = await axios.post(
      API_URLS.AUTH.LOGIN,
      { login, password },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('登录响应:', response.data)

    // 检查响应结构，处理两种可能的格式：
    // 1. 直接返回用户数据对象（当前后端实际情况）
    // 2. 返回AuthResponse格式（包含code, msg, data字段）
    let userData: User;
    
    if (response.data.code !== undefined) {
      // 标准AuthResponse格式
      if (response.data.code !== 200) {
        throw new Error(response.data.msg || '登录失败');
      }
      userData = response.data.data;
    } else {
      // 直接返回用户数据对象
      userData = response.data;
    }

    // 验证返回的用户数据是否包含必要的字段
    if (!userData || !userData.access_token || !userData.refresh_token) {
      console.error('登录响应缺少必要的token信息:', userData)
      throw new Error('服务器返回数据格式异常');
    }

    return userData;
  } catch (error) {
    console.error('登录失败:', error)
    
    if (axios.isAxiosError(error)) {
      // 处理网络错误
      if (!error.response) {
        throw new Error('网络连接失败，请检查网络设置');
      }
      
      // 处理HTTP状态码异常的情况
      if (error.response.status !== 200) {
        // 尝试从不同的响应结构中获取错误信息
        const errorData = error.response.data;
        let errorMessage = '登录失败';
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.msg) {
          errorMessage = errorData.msg;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        throw new Error(errorMessage);
      }
      
      throw new Error('登录失败：' + (error.message || '未知错误'));
    }
    throw error;
  }
}

/**
 * 刷新令牌
 */
export async function refreshToken(refreshToken: string): Promise<User> {
  try {
    console.log('发送刷新token请求')
    
    const response = await axios.post(
      API_URLS.AUTH.REFRESH,
      { token: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('刷新token响应:', response.data)

    // 检查响应结构，处理两种可能的格式
    let userData: User;
    
    if (response.data.code !== undefined) {
      // 标准AuthResponse格式
      if (response.data.code !== 200) {
        throw new Error(response.data.msg || '刷新令牌失败');
      }
      userData = response.data.data;
    } else {
      // 直接返回用户数据对象
      userData = response.data;
    }

    // 验证返回的用户数据是否包含必要的字段
    if (!userData || !userData.access_token || !userData.refresh_token) {
      console.error('刷新令牌响应缺少必要的token信息:', userData)
      throw new Error('服务器返回数据格式异常');
    }

    return userData;
  } catch (error) {
    console.error('刷新令牌失败:', error)
    
    if (axios.isAxiosError(error)) {
      // 处理网络错误
      if (!error.response) {
        throw new Error('网络连接失败，请检查网络设置');
      }
      
      // 处理HTTP状态码异常的情况
      if (error.response.status !== 200) {
        // 尝试从不同的响应结构中获取错误信息
        const errorData = error.response.data;
        let errorMessage = '刷新令牌失败';
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.msg) {
          errorMessage = errorData.msg;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        throw new Error(errorMessage);
      }
      
      throw new Error('刷新令牌失败：' + (error.message || '未知错误'));
    }
    throw error;
  }
}

// 本地存储相关常量
export const TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'user_info';

/**
 * 保存用户信息到本地存储
 */
export function saveUserToLocalStorage(userData: User): void {
  // 保存访问令牌
  localStorage.setItem(TOKEN_KEY, userData.access_token);
  // 保存刷新令牌
  localStorage.setItem(REFRESH_TOKEN_KEY, userData.refresh_token);
  // 保存用户基本信息
  const userInfo = {
    user_id: userData.user_id,
    username: userData.username,
    email: userData.email,
    avatar: userData.avatar,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
}

/**
 * 从本地存储中移除用户信息
 */
export function removeUserFromLocalStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * 从本地存储中获取用户信息
 */
export function getUserFromLocalStorage(): User | null {
  const savedUser = localStorage.getItem(USER_KEY);
  const savedToken = localStorage.getItem(TOKEN_KEY);
  const savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (savedUser && savedToken && savedRefreshToken) {
    try {
      const userInfo = JSON.parse(savedUser);
      return {
        ...userInfo,
        access_token: savedToken,
        refresh_token: savedRefreshToken,
      };
    } catch (error) {
      console.error('Failed to parse user data', error);
      return null;
    }
  }

  return null;
}
