import { Badge } from '@/components/ui/badge';
import { getCategoryNameInChinese } from '@/lib/utils/category';

// 分类徽章颜色映射
const categoryColors: Record<string, string> = {
  '蔬菜': 'bg-green-100 text-green-800 border-green-200',
  '水果': 'bg-orange-100 text-orange-800 border-orange-200',
  '肉类': 'bg-red-100 text-red-800 border-red-200',
  '海鲜': 'bg-blue-100 text-blue-800 border-blue-200',
  '乳制品': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '面点': 'bg-amber-100 text-amber-800 border-amber-200',
  '米饭': 'bg-amber-100 text-amber-800 border-amber-200',
  '甜点': 'bg-pink-100 text-pink-800 border-pink-200',
  '饮料': 'bg-purple-100 text-purple-800 border-purple-200',
  '零食': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '快餐': 'bg-red-100 text-red-700 border-red-200',
  '面包': 'bg-amber-50 text-amber-800 border-amber-200',
  '有机食品': 'bg-green-50 text-green-700 border-green-100',
  '罐头食品': 'bg-gray-100 text-gray-800 border-gray-200',
  '冷冻食品': 'bg-blue-50 text-blue-700 border-blue-100',
  '即食品': 'bg-purple-50 text-purple-700 border-purple-100',
  '调味品': 'bg-red-50 text-red-700 border-red-100',
  '其他': 'bg-gray-100 text-gray-700 border-gray-200',
};

interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showOriginal?: boolean; // 是否显示原始分类名称（不转换）
}

export function CategoryBadge({ 
  category, 
  size = 'md', 
  className = '',
  showOriginal = false
}: CategoryBadgeProps) {
  if (!category) return null;

  // 转换为中文分类名称（如果是英文）
  const displayCategory = showOriginal ? category : getCategoryNameInChinese(category);
  
  // 获取自定义颜色样式，如果没有预设则使用默认样式
  const colorClasses = categoryColors[displayCategory] || 'bg-gray-100 text-gray-800 border-gray-200';
  
  // 根据尺寸设置不同的样式
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  }[size];

  return (
    <Badge 
      variant="outline" 
      className={`font-medium ${colorClasses} ${sizeClasses} ${className}`}
    >
      {displayCategory}
    </Badge>
  );
}
