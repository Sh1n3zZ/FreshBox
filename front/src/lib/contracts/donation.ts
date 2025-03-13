export interface DonationStats {
  totalAmount: number;
  totalOrders: number;
  totalUsers: number;
  totalMerchants: number;
  savedFood: {
    weight: number; // 单位：kg
    co2Reduction: number; // 单位：kg
  };
}

export interface DonationRecord {
  id: string;
  amount: number;
  userId: string;
  userName: string;
  merchantId: string;
  merchantName: string;
  createdAt: string;
  boxId: string;
  boxName: string;
  transactionHash?: string;
  chainId?: number;
}

export interface DonationListResponse {
  donations: DonationRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DonationCertificate {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  createdAt: string;
  imageUrl: string;
  verificationCode: string;
  boxDetails: {
    name: string;
    quantity: number;
    savedWeight: number;
    co2Reduction: number;
  };
} 