import { useState, useEffect } from 'react';
import { APIClient } from '@/lib/api/client';
import type { DonationStats } from '@/lib/contracts/donation';

interface UseDonationStatsProps {
  pollingInterval?: number; // 轮询间隔，单位毫秒
}

export function useDonationStats({ pollingInterval = 30000 }: UseDonationStatsProps = {}) {
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const api = APIClient.getInstance();
        const response = await api.client.get('/api/donations/stats');
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取捐赠统计数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    // 立即获取一次数据
    fetchStats();

    // 设置轮询
    const interval = setInterval(fetchStats, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingInterval]);

  return {
    stats,
    isLoading,
    error,
    // 格式化方法
    formatWeight: (weight: number) => `${weight.toFixed(1)}kg`,
    formatCO2: (co2: number) => `${co2.toFixed(1)}kg`,
    formatAmount: (amount: number) => `¥${amount.toFixed(2)}`,
  };
} 