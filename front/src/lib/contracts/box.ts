export interface Box {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  currentPrice: number;
  discount: number;
  category: string;
  imageUrl: string;
  status: string;
  expiryDate: string;
  createdAt: string;
  quantity?: number;
  tags?: string[];
  merchant?: {
    id: string;
    name: string;
    logo: string;
    address: string;
  };
  nutritionFacts?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  allergens?: string[];
}

export interface BoxListResponse {
  boxes: Box[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BoxListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'expiry' | 'popularity';
  order?: 'asc' | 'desc';
  search?: string;
}

export interface PurchaseBoxRequest {
  boxId: string;
  quantity: number;
  paymentMethod: 'wechat' | 'alipay';
}

export interface PurchaseBoxResponse {
  orderId: string;
  paymentUrl: string;
  qrCode?: string;
}
