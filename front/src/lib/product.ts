import axios from 'axios';
import { API_URLS } from '@/conf/env';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageURL: string;
  status: string;
  productionDate: string;
  shelfLifeHours: number;
  createdAt: string;
}

export interface ProductListOptions {
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

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  size: number;
}

export const productService = {
  // 获取产品列表
  async listProducts(options: ProductListOptions): Promise<ProductListResponse> {
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

    const response = await axios.get(`${API_URLS.PRODUCT.LIST}?${params.toString()}`);
    return response.data;
  },

  // 获取产品详情
  async getProduct(id: string): Promise<Product> {
    const response = await axios.get(API_URLS.PRODUCT.DETAIL(id));
    return response.data;
  },

  // 创建产品
  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await axios.post(API_URLS.PRODUCT.CREATE, data);
    return response.data;
  },

  // 更新产品
  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await axios.put(API_URLS.PRODUCT.UPDATE(id), data);
    return response.data;
  },

  // 删除产品
  async deleteProduct(id: string): Promise<void> {
    await axios.delete(API_URLS.PRODUCT.DELETE(id));
  },

  // 根据状态获取产品列表
  async getProductsByStatus(status: string, page: number = 1, size: number = 10): Promise<ProductListResponse> {
    const response = await axios.get(`${API_URLS.PRODUCT.BY_STATUS}?status=${status}&page=${page}&size=${size}`);
    return response.data;
  },

  // 获取盲盒内的产品
  async getProductsByBlindBox(boxId: string): Promise<Product[]> {
    const response = await axios.get(API_URLS.PRODUCT.BY_BOX(boxId));
    return response.data.products;
  },

  // 添加产品到盲盒
  async addProductToBlindBox(productId: string, boxId: string): Promise<void> {
    await axios.post(API_URLS.PRODUCT.ADD_TO_BOX(productId), { blind_box_id: boxId });
  },

  // 从盲盒中移除产品
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
