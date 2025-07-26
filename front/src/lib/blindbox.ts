import axios from 'axios';
import apiClient from '@/lib/api';
import { API_URLS } from '@/conf/env';
import { Product } from './product';

export interface BlindBox {
  id: string;
  name: string;
  description: string;
  discountCoefficient: number;
  category: string;
  imageUrl: string;
  status: string;
  expirationTime: string;
  donationAmount: number;
  productCount: number;
  createdAt: string;
  creatorId?: string;
}

export interface BlindBoxDetail extends BlindBox {
  products: Product[];
}

// Define ProductDTO directly here based on backend response
export interface ProductDTO {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  status: string;
  productionDate: string;
  shelfLifeHours: number;
  createdAt: string;
}

// 用于创建/更新盲盒的数据结构
export interface BlindBoxInputData {
  name: string;
  description?: string;
  discountCoefficient: number;
  category: string;
  imageURL?: string;
  donationAmount?: number;
  expirationTime?: string;
}

export interface BlindBoxListOptions {
  page?: number;
  size?: number;
  category?: string;
  status?: string;
  keyword?: string;
  sortBy?: string;
  order?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface BlindBoxListResponse {
  boxes: BlindBox[];
  total: number;
  page: number;
  size: number;
}

// 购买盲盒响应
export interface PurchaseResponse {
  message: string;
  order_id: string;
  box_id: string;
  price: number;
  status: string;
}

// 开启盲盒响应
export interface OpenBoxResponse {
  message: string;
  opening_id: string;
  box_id: string;
  product_id: string;
  product_name: string;
  product_info: ProductDTO; // Use the locally defined DTO
  opened_at: string;
}

export const blindboxService = {
  // 获取盲盒列表
  async listBlindBoxes(options: BlindBoxListOptions): Promise<BlindBoxListResponse> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.size) params.append('size', options.size.toString());
    if (options.category) params.append('category', options.category);
    if (options.status) params.append('status', options.status);
    if (options.keyword) params.append('keyword', options.keyword);
    if (options.sortBy) params.append('sort_by', options.sortBy);
    if (options.order) params.append('order', options.order);
    if (options.minPrice) params.append('min_price', options.minPrice.toString());
    if (options.maxPrice) params.append('max_price', options.maxPrice.toString());

    const response = await axios.get(`${API_URLS.BOX.LIST}?${params.toString()}`);
    return response.data;
  },

  // 获取盲盒详情
  async getBlindBox(id: string): Promise<BlindBoxDetail> {
    const response = await axios.get(API_URLS.BOX.DETAIL(id));
    return response.data;
  },

  // 创建盲盒
  async createBlindBox(data: BlindBoxInputData): Promise<BlindBox> {
    const response = await axios.post(API_URLS.BOX.CREATE, data);
    // Backend returns { message, box_id }, let's assume we need the box details after creation for consistency.
    // This might require an additional getBlindBox call or backend changes.
    // For now, returning the simple response to match backend.
    // return response.data; 
    // To make it work with front-end expectations (needs a BlindBox object)
    // We return a partial object, real data needs refresh or backend change.
    return { id: response.data.box_id, ...data } as BlindBox; 
  },

  // 更新盲盒
  async updateBlindBox(id: string, data: Partial<BlindBoxInputData>): Promise<BlindBox> {
    await axios.put(API_URLS.BOX.UPDATE(id), data);
    // Backend returns { message, box_id }, we need to get the updated box details
    const updatedBox = await this.getBlindBox(id);
    return updatedBox;
  },

  // 删除盲盒
  async deleteBlindBox(id: string): Promise<void> {
    await axios.delete(API_URLS.BOX.DELETE(id));
  },

  // 购买盲盒
  async purchaseBlindBox(id: string): Promise<PurchaseResponse> {
    const response = await axios.post(API_URLS.BOX.PURCHASE(id));
    return response.data;
  },

  // 开启盲盒
  async openBlindBox(id: string): Promise<OpenBoxResponse> {
    const response = await axios.post(API_URLS.BOX.OPEN(id));
    return response.data;
  },

  // 获取盲盒开启历史
  async getBlindBoxOpeningHistory(id: string): Promise<any[]> {
    const response = await axios.get(API_URLS.BOX.HISTORY(id));
    return response.data.openings;
  },

  // 添加产品到盲盒
  async addProductToBlindBox(productId: string, boxId: string): Promise<void> {
    await axios.post(API_URLS.PRODUCT.ADD_TO_BOX(productId), { blind_box_id: boxId });
  },

  // 从盲盒移除产品
  async removeProductFromBlindBox(productId: string): Promise<void> {
    await axios.post(API_URLS.PRODUCT.REMOVE_FROM_BOX(productId));
  },

  // 批量添加产品到盲盒
  async batchAddProductsToBlindBox(productIds: string[], boxId: string): Promise<void> {
    await axios.post(API_URLS.PRODUCT.BATCH_ADD_TO_BOX, {
      product_ids: productIds,
      blind_box_id: boxId,
    });
  },

  // 上传盲盒封面图片
  async uploadBlindboxCover(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post(API_URLS.UPLOAD.WITH_TYPE('box'), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // 约定后端返回 { code, data: { url } }
    return response.data.data?.url || '';
  },
};
