import axios from 'axios';
import { API_URLS } from '@/conf/env';
import apiClient, { apiService } from './api';

// 新增：配料接口定义
export interface Ingredient {
  id: string;
  name: string;
  category: string; // '谷物', '果蔬', '蛋白质', '添加剂', '其他'
  is_allergen: boolean; // 后端字段名可能是 snake_case
  description?: string;
}

// 新增：生产商接口定义
export interface Manufacturer {
  id: string;
  name: string;
  contact_phone?: string;
  address?: string;
  certification_number?: string;
  created_at: string;
}

// 更新：产品接口定义
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageURL?: string;
  status: string; // 'available', 'in_blind_box', 'sold'
  productionDate: string;
  shelfLifeHours: number;
  createdAt: string;
  manufacturerId: string;    // 新增
  batchNumber?: string;       // 新增
  storageCondition: string;  // 新增: '常温', '冷藏', '冷冻'
  ingredients?: Ingredient[]; // 新增: 关联的配料 (详情时可能返回)
  manufacturer?: Manufacturer;// 新增: 关联的生产商 (详情时可能返回)
  creatorName?: string;       // DTO字段
  manufacturerName?: string; // DTO字段 (列表可能返回)
}

// 用于创建/更新产品时传递的数据结构
export interface ProductInputData {
  name: string;
  description?: string;
  price: number;
  category: string;
  imageURL?: string;
  productionDate: string;    // ISO 8601 format string
  shelfLifeHours: number;
  manufacturerId: string;
  batchNumber?: string;
  storageCondition: string; // '常温', '冷藏', '冷冻'
  ingredientIds?: string[];  // 传递配料ID列表
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

// 更新：产品列表响应可能包含制造商名称
export interface ProductListResponse {
  products: Product[]; // Product 类型已更新
  total: number;
  page: number;
  size: number;
}

// 新增：生产商列表响应接口
interface ManufacturerListResponse {
  manufacturers: Manufacturer[];
  total: number;
}

// 新增：配料列表响应接口
interface IngredientListResponse {
  ingredients: Ingredient[];
  total: number;
}

// 新增：快速创建生产商的输入数据接口
export interface ManufacturerInputData {
  name: string;
  contact_phone?: string;
  address?: string;
  certification_number?: string;
}

// 新增：快速创建配料的输入数据接口
export interface IngredientInputData {
  name: string;
  category: string;
  is_allergen: boolean;
  description?: string;
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
    // 注意：后端返回的 product DTO 可能需要调整以匹配前端 Product 接口，尤其是 manufacturerName
    return response.data;
  },

  // 获取产品详情 (预期返回包含 manufacturer 和 ingredients)
  async getProduct(id: string): Promise<Product> {
    const response = await axios.get(API_URLS.PRODUCT.DETAIL(id));
    return response.data; // 假设后端直接返回符合更新后 Product 接口的数据
  },

  // 创建产品 (使用新的输入数据结构)
  async createProduct(data: ProductInputData): Promise<Product> {
    const response = await axios.post(API_URLS.PRODUCT.CREATE, data);
    return response.data; // 返回创建后的产品信息 (可能不含关联对象)
  },

  // 更新产品 (使用新的输入数据结构)
  async updateProduct(id: string, data: Partial<ProductInputData>): Promise<Product> {
    const response = await axios.put(API_URLS.PRODUCT.UPDATE(id), data);
    return response.data; // 返回更新后的产品信息 (可能不含关联对象)
  },

  async deleteProduct(id: string): Promise<void> {
    await axios.delete(API_URLS.PRODUCT.DELETE(id));
  },

  async getProductsByStatus(status: string, page: number = 1, size: number = 10): Promise<ProductListResponse> {
    const response = await axios.get(`${API_URLS.PRODUCT.BY_STATUS}?status=${status}&page=${page}&size=${size}`);
    return response.data;
  },

  async getProductsByBlindBox(boxId: string): Promise<Product[]> {
    const response = await axios.get(API_URLS.PRODUCT.BY_BOX(boxId));
    return response.data.products;
  },

  async addProductToBlindBox(productId: string, boxId: string): Promise<void> {
    await axios.post(API_URLS.PRODUCT.ADD_TO_BOX(productId), { blind_box_id: boxId });
  },

  async removeProductFromBlindBox(productId: string): Promise<void> {
    await axios.post(API_URLS.PRODUCT.REMOVE_FROM_BOX(productId));
  },

  async batchAddProductsToBlindBox(productIds: string[], boxId: string): Promise<void> {
    await axios.post(API_URLS.PRODUCT.BATCH_ADD_TO_BOX, {
      product_ids: productIds,
      blind_box_id: boxId,
    });
  },

  async listManufacturers(): Promise<Manufacturer[]> {
    try {
      const response = await axios.get<ManufacturerListResponse>(API_URLS.MANUFACTURER.LIST);
      return response.data.manufacturers || [];
    } catch (error) {
      console.error("Failed to fetch manufacturers:", error);
      throw error;
    }
  },

  async listIngredients(): Promise<Ingredient[]> {
    try {
      const response = await axios.get<IngredientListResponse>(API_URLS.INGREDIENT.LIST);
      return response.data.ingredients || [];
    } catch (error) {
      console.error("Failed to fetch ingredients:", error);
      throw error;
    }
  },

  async quickCreateManufacturer(data: ManufacturerInputData): Promise<Manufacturer> {
    try {
      const response = await apiClient.post<{ message: string; manufacturer_id: string }>(
        API_URLS.MANUFACTURER.CREATE,
        data
      );
      const manufacturer = await apiClient.get<Manufacturer>(
        API_URLS.MANUFACTURER.DETAIL(response.data.manufacturer_id)
      );
      return manufacturer.data;
    } catch (error) {
      console.error("Failed to create manufacturer:", error);
      throw error;
    }
  },

  async quickCreateIngredient(data: IngredientInputData): Promise<Ingredient> {
    try {
      const response = await apiClient.post<{ message: string; ingredient_id: string }>(
        API_URLS.INGREDIENT.CREATE,
        data
      );
      // 创建成功后立即获取详情
      const ingredient = await apiClient.get<Ingredient>(
        API_URLS.INGREDIENT.DETAIL(response.data.ingredient_id)
      );
      return ingredient.data;
    } catch (error) {
      console.error("Failed to create ingredient:", error);
      throw error;
    }
  }
};
