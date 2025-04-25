import axios from 'axios';
import { API_URLS } from '@/conf/env';
import { Product } from './product';

export interface BlindBox {
  id: string;
  name: string;
  description: string;
  discountCoefficient: number;
  category: string;
  imageURL: string;
  status: string;
  expirationTime: string;
  donationAmount: number;
  productCount: number;
  createdAt: string;
  creatorID?: string;
}

export interface BlindBoxDetail extends BlindBox {
  products: Product[];
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
    return response.data;
  },

  // 更新盲盒
  async updateBlindBox(id: string, data: Partial<BlindBoxInputData>): Promise<BlindBox> {
    const response = await axios.put(API_URLS.BOX.UPDATE(id), data);
    return response.data;
  },

  // 删除盲盒
  async deleteBlindBox(id: string): Promise<void> {
    await axios.delete(API_URLS.BOX.DELETE(id));
  },

  // 购买盲盒
  async purchaseBlindBox(id: string): Promise<{ orderId: string; price: number }> {
    const response = await axios.post(API_URLS.BOX.PURCHASE(id));
    return response.data;
  },

  // 开启盲盒
  async openBlindBox(id: string): Promise<{ productId: string; productName: string }> {
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
  }
};
