// API基础URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// 通用请求函数
async function fetchAPI(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  // 添加认证令牌（如果有）
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
  }

  const response = await fetch(url, defaultOptions);
  
  // 处理API错误
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    throw new Error(errorData.msg || `API请求失败: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Dashboard API
export const dashboardAPI = {
  // 获取仪表盘摘要
  getSummary: () => fetchAPI('/dashboard/summary'),
  
  // 获取收入统计
  getRevenueStats: () => fetchAPI('/dashboard/revenue'),
  
  // 获取盲盒类别统计
  getBoxCategories: () => fetchAPI('/dashboard/categories'),
  
  // 获取用户活跃度
  getUserActivity: () => fetchAPI('/dashboard/user-activity'),
  
  // 获取捐赠统计
  getDonationStats: () => fetchAPI('/dashboard/donations'),
  
  // 获取最近创建的盲盒
  getRecentBoxes: () => fetchAPI('/dashboard/recent-boxes'),
  
  // 获取表现最好的任务
  getTopTasks: () => fetchAPI('/dashboard/top-tasks'),
};

// 盲盒API
export const boxesAPI = {
  // 获取所有盲盒
  getAll: () => fetchAPI('/boxes'),
  
  // 获取单个盲盒
  getById: (id: string) => fetchAPI(`/boxes/${id}`),
  
  // 创建盲盒
  create: (data: any) => fetchAPI('/boxes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // 更新盲盒
  update: (id: string, data: any) => fetchAPI(`/boxes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // 删除盲盒
  delete: (id: string) => fetchAPI(`/boxes/${id}`, {
    method: 'DELETE',
  }),
  
  // 购买盲盒
  purchase: (id: string) => fetchAPI(`/boxes/${id}/purchase`, {
    method: 'POST',
  }),
};

// 用户API
export const userAPI = {
  // 注册
  register: (data: any) => fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // 登录
  login: (data: any) => fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // 获取用户信息
  getProfile: () => fetchAPI('/user/profile'),
  
  // 更新用户信息
  updateProfile: (data: any) => fetchAPI('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};
