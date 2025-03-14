// 英文分类到中文的映射
export const categoryEnToZh: Record<string, string> = {
  'vegetables': '蔬菜',
  'fruits': '水果',
  'meat': '肉类',
  'seafood': '海鲜',
  'dairy': '乳制品',
  'pastry': '面点',
  'rice': '米饭',
  'dessert': '甜点',
  'beverages': '饮料',
  'snacks': '零食',
  'food': '食品',
  'bread': '面包',
  'organic': '有机食品',
  'canned': '罐头食品',
  'frozen': '冷冻食品',
  'spices': '调味品',
  'other': '其他',
};

// 中文分类到英文的映射（反向映射）
export const categoryZhToEn: Record<string, string> = Object.entries(categoryEnToZh)
  .reduce((acc, [en, zh]) => ({...acc, [zh]: en}), {});

// 获取中文分类名称
export function getCategoryNameInChinese(enName: string): string {
  return categoryEnToZh[enName.toLowerCase()] || enName;
}

// 获取英文分类名称
export function getCategoryNameInEnglish(zhName: string): string {
  return categoryZhToEn[zhName] || zhName;
}

// 所有中文分类列表
export const allCategoriesInChinese = Object.values(categoryEnToZh);

// 所有英文分类列表
export const allCategoriesInEnglish = Object.keys(categoryEnToZh); 