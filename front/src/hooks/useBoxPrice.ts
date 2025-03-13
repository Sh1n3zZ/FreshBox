import { useState, useEffect } from 'react';

interface UseBoxPriceProps {
  originalPrice: number;
  expiryDate: string;
  baseDiscountRate?: number; // 基础折扣率
  minDiscountRate?: number; // 最低折扣率
}

export function useBoxPrice({
  originalPrice,
  expiryDate,
  baseDiscountRate = 0.8,
  minDiscountRate = 0.3,
}: UseBoxPriceProps) {
  const [currentPrice, setCurrentPrice] = useState(originalPrice);
  const [remainingHours, setRemainingHours] = useState(0);

  useEffect(() => {
    const calculatePrice = () => {
      const now = new Date();
      const expiry = new Date(expiryDate);
      const diffInHours = Math.max(0, (expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      // 计算动态折扣率
      // 48小时内开始降价，每小时递减1%，但不低于最低折扣率
      const hoursUntilExpiry = Math.min(48, diffInHours);
      const dynamicRate = Math.max(
        minDiscountRate,
        baseDiscountRate - ((48 - hoursUntilExpiry) * 0.01)
      );
      
      setRemainingHours(Math.floor(diffInHours));
      setCurrentPrice(Number((originalPrice * dynamicRate).toFixed(2)));
    };

    calculatePrice();
    const interval = setInterval(calculatePrice, 60000); // 每分钟更新一次
    
    return () => clearInterval(interval);
  }, [originalPrice, expiryDate, baseDiscountRate, minDiscountRate]);

  return {
    currentPrice,
    remainingHours,
    discountPercentage: Math.round((1 - currentPrice / originalPrice) * 100),
  };
} 