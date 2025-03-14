import React from 'react';
import { CategoryBadge } from './CategoryBadge';
import { allCategoriesInChinese } from '@/lib/utils/category';

interface BoxDetailCategoriesProps {
  category: string;      // 主分类（英文）
  tags?: string[];       // 标签（英文）
  className?: string;
}

/**
 * 盲盒详情页面的分类和标签展示组件
 * 支持从英文转换到中文显示
 */
export function BoxDetailCategories({
  category,
  tags = [],
  className = '',
}: BoxDetailCategoriesProps) {
  if (!category && (!tags || tags.length === 0)) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* 主分类 */}
      {category && (
        <CategoryBadge 
          category={category} 
          size="lg" 
        />
      )}
      
      {/* 额外标签 */}
      {tags && tags.length > 0 && tags.map((tag) => (
        <CategoryBadge
          key={tag}
          category={tag}
          size="md"
        />
      ))}
    </div>
  );
} 