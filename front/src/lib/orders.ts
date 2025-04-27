import axios from 'axios';
import { API_URLS } from '@/conf/env';

export interface BlindBoxOrder {
  id: string;
  blindBoxID: string;
  userID: string;
  price: number;
  status: string;
  paymentType?: string;
  paymentID?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface BlindBoxOrderListOptions {
  page?: number;
  size?: number;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  startTime?: string;
  endTime?: string;
  userID?: string;
  blindBoxID?: string;
  sortBy?: string;
  order?: string;
}

export interface BlindBoxOrderListResponse {
  orders: BlindBoxOrder[];
  total: number;
  page: number;
  size: number;
}

export const orderService = {
  // 获取订单列表
  async listOrders(options: BlindBoxOrderListOptions): Promise<BlindBoxOrderListResponse> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.size) params.append('size', options.size.toString());
    if (options.status) params.append('status', options.status);
    if (options.minPrice) params.append('min_price', options.minPrice.toString());
    if (options.maxPrice) params.append('max_price', options.maxPrice.toString());
    if (options.startTime) params.append('start_time', options.startTime);
    if (options.endTime) params.append('end_time', options.endTime);
    if (options.userID) params.append('user_id', options.userID);
    if (options.blindBoxID) params.append('blind_box_id', options.blindBoxID);
    if (options.sortBy) params.append('sort_by', options.sortBy);
    if (options.order) params.append('order', options.order);

    const response = await axios.get(`${API_URLS.ORDER.ADMIN.LIST}?${params.toString()}`);
    return response.data;
  },

  // 更新订单信息
  async updateOrder(id: string, updates: Partial<BlindBoxOrder>): Promise<void> {
    await axios.put(API_URLS.ORDER.ADMIN.UPDATE(id), updates);
  },

  // 删除订单
  async deleteOrder(id: string): Promise<void> {
    await axios.delete(API_URLS.ORDER.ADMIN.DELETE(id));
  },

  // 标记订单为已支付
  async markOrderAsPaid(id: string): Promise<void> {
    await axios.post(API_URLS.ORDER.ADMIN.MARK_PAID(id));
  },
};
