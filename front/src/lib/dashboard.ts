import axios from 'axios';
import { API_URLS } from '@/conf/env';

export interface BlindBoxOpeningTrend {
  date: string;
  count: number;
}

export interface BlindBoxOpeningTrendResponse {
  data: {
    data: BlindBoxOpeningTrend[];
    trendPercentage: number;
  };
}

export interface DashboardStats {
  dailyRevenue: number;
  dailyRevenueChange: number;
  dailyRevenueIsPositive: boolean;
  totalBoxes: number;
  totalBoxesChange: number;
  totalBoxesIsPositive: boolean;
  totalUsers: number;
  totalUsersChange: number;
  totalUsersIsPositive: boolean;
  totalDonations: number;
  totalDonationsChange: number;
  totalDonationsIsPositive: boolean;
}

export interface ActivityItem {
  id: string;
  user: string;
  avatar: string;
  action: 'purchased' | 'opened' | 'donated';
  time: number;
  timeUnit: 'minutesAgo' | 'hoursAgo' | 'daysAgo';
  boxCount?: number;
  boxName?: string;
  openedAt?: string;
}

export interface RecentActivityResponse {
  data: ActivityItem[];
}

export interface LLMSummaryResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  status: string;
}

export interface MockDataParams {
  boxCount: number;
  productCount: number;
  userCount: number;
  orderCount: number;
  openingCount: number;
  dayRange: number;
}

export interface MockDataResult {
  boxesCreated: number;
  productsCreated: number;
  usersCreated: number;
  ordersCreated: number;
  openingsCreated: number;
  daysOfData: number;
}

export const dashboardService = {
  getBlindBoxOpeningTrend: async (startTime: string, endTime: string): Promise<BlindBoxOpeningTrendResponse> => {
    const response = await axios.get(`${API_URLS.DASHBOARD.BLIND_BOX_TREND}?startTime=${startTime}&endTime=${endTime}`);
    return response.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await axios.get(API_URLS.DASHBOARD.SUMMARY);
    return response.data.stats;
  },

  getRecentActivity: async (): Promise<RecentActivityResponse> => {
    const response = await axios.get(API_URLS.DASHBOARD.RECENT_ACTIVITY);
    return response.data;
  },
  
  getLLMSummary: async (): Promise<LLMSummaryResponse> => {
    const response = await axios.get(API_URLS.DASHBOARD.LLM_SUMMARY);
    return response.data;
  },

  generateMockData: async (params: MockDataParams): Promise<MockDataResult> => {
    const response = await axios.post(API_URLS.DASHBOARD.GENERATE_MOCK_DATA, params);
    return response.data;
  },
};
