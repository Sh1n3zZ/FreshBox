import React from 'react';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from './CategoryBadge';
import { 
  allCategoriesInChinese, 
  getCategoryNameInEnglish 
} from '@/lib/utils/category';

// 预定义分类列表 - 中文
const defaultCategories = ['全部', ...allCategoriesInChinese];

interface CategoryFilterProps {
  selectedCategory: string; // 英文分类值
  onSelectCategory: (category: string) => void; // 传递英文分类值
  categories?: string[]; // 可选，自定义中文分类列表
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  categories = defaultCategories,
}: CategoryFilterProps) {
  // 获取选中分类的中文名称（用于UI显示）
  const getSelectedCategoryInChinese = (): string => {
    if (!selectedCategory) return '全部';
    // 查找categories中与英文selectedCategory对应的中文分类
    const index = categories.findIndex(
      zh => getCategoryNameInEnglish(zh) === selectedCategory.toLowerCase()
    );
    return index >= 0 ? categories[index] : selectedCategory;
  };

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium mb-2">食品分类</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((categoryZh) => {
          // 是否是全部类别
          const isAll = categoryZh === '全部';
          // 当前分类按钮是否被选中
          const isSelected = isAll 
            ? !selectedCategory 
            : getCategoryNameInEnglish(categoryZh) === selectedCategory;
          
          return (
            <Button
              key={categoryZh}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                // 全部类别传空字符串，其他类别传英文分类值
                onSelectCategory(isAll ? '' : getCategoryNameInEnglish(categoryZh));
              }}
              className="rounded-full"
            >
              {isAll ? (
                '全部分类'
              ) : (
                <CategoryBadge 
                  category={categoryZh} 
                  size="sm"
                  showOriginal={true} // 显示原始中文名称
                  className={isSelected ? 'border-transparent bg-transparent text-white' : ''}
                />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
} 