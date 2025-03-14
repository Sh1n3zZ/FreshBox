"use client";

import { useState, useEffect } from 'react';
import type { Box } from '@/lib/contracts/box';

export function useBoxPrice(box: Box) {
  const { originalPrice, currentPrice, expiryDate } = box;
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(0);
  const [formattedPrice, setFormattedPrice] = useState('');
  const [formattedDiscount, setFormattedDiscount] = useState('');

  useEffect(() => {
    // 计算到期天数
    const calculateDaysUntilExpiry = () => {
      const now = new Date();
      const expiry = new Date(expiryDate);
      // 设置时间为当天结束
      expiry.setHours(23, 59, 59, 999);
      
      // 计算天数差异（向上取整）
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    };

    // 格式化价格和折扣显示
    const formatPrice = (price: number): string => {
      return price.toFixed(2);
    };

    const formatDiscount = (discount: number): string => {
      return Math.round(discount).toString();
    };

    setDaysUntilExpiry(calculateDaysUntilExpiry());
    setFormattedPrice(formatPrice(currentPrice));
    setFormattedDiscount(formatDiscount(box.discount));

    // 每小时更新一次
    const interval = setInterval(() => {
      setDaysUntilExpiry(calculateDaysUntilExpiry());
    }, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [expiryDate, currentPrice, box.discount, originalPrice]);

  return {
    formattedPrice,
    formattedDiscount,
    daysUntilExpiry,
    currentPrice,
    originalPrice,
  };
} 