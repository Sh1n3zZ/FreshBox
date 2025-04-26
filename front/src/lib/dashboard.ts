import axios from 'axios';
import { API_URLS } from '@/conf/env';

export interface DashboardStats {
  dailyRevenue: number;
  totalBoxes: number;
  totalUsers: number;
  averageDiscount: number;
  totalDonations: number;
  activeBoxesCount: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  boxes: number;
}

export interface ChartData {
  name: string;
  value: number;
  boxes?: number;
}

export interface DashboardData {
  stats: DashboardStats;
  categoryDistribution: CategoryDistribution[];
  recentRevenue: RevenueData[];
  charts: {
    daily: ChartData[];
    weekly: ChartData[];
    monthly: ChartData[];
    yearly: ChartData[];
  };
}

export const dashboardService = {
  // 获取仪表盘汇总数据
  async getDashboardSummary(): Promise<DashboardStats> {
    const response = await axios.get(API_URLS.DASHBOARD.SUMMARY);
    return response.data;
  },

  // 获取营收数据
  async getRevenueData(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<RevenueData[]> {
    const response = await axios.get(`${API_URLS.DASHBOARD.REVENUE}?period=${period}`);
    return response.data;
  },

  // 获取盲盒分类分布
  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    const response = await axios.get(API_URLS.DASHBOARD.CATEGORIES);
    return response.data;
  },

  // 获取图表数据
  async getChartData(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<ChartData[]> {
    const response = await axios.get(`${API_URLS.DASHBOARD.REVENUE}/${period}`);
    return response.data;
  },

  // 修改获取所有仪表盘数据的方法
  async getAllDashboardData(): Promise<DashboardData> {
    try {
      const [stats, categoryDistribution, recentRevenue, daily, weekly, monthly, yearly] = await Promise.all([
        this.getDashboardSummary(),
        this.getCategoryDistribution(),
        this.getRevenueData(),
        this.getChartData('daily'),
        this.getChartData('weekly'),
        this.getChartData('monthly'),
        this.getChartData('yearly'),
      ]);

      // 如果后端API还未实现，使用模拟数据
      const mockData = {
        stats: stats || {
          dailyRevenue: 12500,
          totalBoxes: 150,
          totalUsers: 1200,
          averageDiscount: 0.8,
          totalDonations: 5000,
          activeBoxesCount: 85
        },
        categoryDistribution: categoryDistribution || [],
        recentRevenue: recentRevenue || [],
        charts: {
          daily: daily || this.generateMockChartData(7),
          weekly: weekly || this.generateMockChartData(4),
          monthly: monthly || this.generateMockChartData(12),
          yearly: yearly || this.generateMockChartData(5)
        }
      };

      return mockData;
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
      throw error;
    }
  },

  // 添加生成模拟数据的辅助方法
  generateMockChartData(count: number): ChartData[] {
    return Array.from({ length: count }, (_, i) => ({
      name: `数据 ${i + 1}`,
      value: Math.floor(Math.random() * 10000),
      boxes: Math.floor(Math.random() * 100)
    }));
  }
};
