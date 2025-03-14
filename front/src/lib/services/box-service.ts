import { APIClient } from '@/lib/api/client';
import { Box } from '@/lib/contracts/box';

const apiClient = APIClient.getInstance().client;

// 扩展 Box 类型为 BoxDetailDTO 类型
export interface BoxDetailDTO extends Box {
  nutritionFacts?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  allergens?: string[];
}

// 创建盲盒所需参数
export interface CreateBoxParams {
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
}

// 盲盒列表查询参数
export interface BoxListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
  sort?: string;
  sortDirection?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
}

// 盲盒服务类
export class BoxService {
  /**
   * 获取盲盒列表
   */
  static async getBoxes(params: BoxListParams = {}): Promise<{ items: Box[], total: number }> {
    const response = await apiClient.get('/boxes', { params });
    return response.data;
  }

  /**
   * 获取盲盒详情
   */
  static async getBoxDetail(id: string): Promise<BoxDetailDTO> {
    try {
      const response = await apiClient.get(`/boxes/${id}`);
      
      // 确保响应格式与前端模型匹配
      if (response.data && response.data.code === 200 && response.data.data) {
        // 提取data字段作为实际数据
        const boxData = response.data.data;
        
        // 确保价格字段为数字类型
        return {
          ...boxData,
          currentPrice: typeof boxData.currentPrice === 'number' ? boxData.currentPrice : parseFloat(boxData.currentPrice) || 0,
          originalPrice: typeof boxData.originalPrice === 'number' ? boxData.originalPrice : parseFloat(boxData.originalPrice) || 0,
          discount: typeof boxData.discount === 'number' ? boxData.discount : parseFloat(boxData.discount) || 0
        };
      }
      
      throw new Error('获取盲盒详情失败: ' + (response.data?.msg || '未知错误'));
    } catch (error) {
      console.error('获取盲盒详情异常:', error);
      throw error;
    }
  }

  /**
   * 创建盲盒（JSON格式）
   */
  static async createBox(params: CreateBoxParams): Promise<Box> {
    const response = await apiClient.post('/boxes', params);
    return response.data;
  }

  /**
   * 创建盲盒（FormData格式，用于上传图片）
   */
  static async createBoxWithImage(formData: FormData): Promise<Box> {
    const response = await apiClient.post('/boxes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * 购买盲盒
   */
  static async purchaseBox(id: string): Promise<any> {
    const response = await apiClient.post(`/boxes/${id}/purchase`);
    return response.data;
  }

  /**
   * 更新盲盒
   */
  static async updateBox(id: string, params: Partial<CreateBoxParams>): Promise<Box> {
    const response = await apiClient.put(`/boxes/${id}`, params);
    return response.data;
  }

  /**
   * 更新盲盒（FormData格式，用于上传图片）
   */
  static async updateBoxWithImage(id: string, formData: FormData): Promise<Box> {
    const response = await apiClient.put(`/boxes/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * 删除盲盒
   */
  static async deleteBox(id: string): Promise<void> {
    await apiClient.delete(`/boxes/${id}`);
  }
} 