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

export const dashboardService = {
  getBlindBoxOpeningTrend: async (startTime: string, endTime: string): Promise<BlindBoxOpeningTrendResponse> => {
    const response = await axios.get(`${API_URLS.DASHBOARD.BLIND_BOX_TREND}?startTime=${startTime}&endTime=${endTime}`);
    return response.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await axios.get(API_URLS.DASHBOARD.SUMMARY);
    return response.data.stats;
  },
};
