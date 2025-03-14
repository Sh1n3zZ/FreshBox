'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BoxService } from '@/lib/services/box-service';

const CATEGORIES = [
  { value: 'food', label: '食品' },
  { value: 'beverage', label: '饮料' },
  { value: 'fruit', label: '水果' },
  { value: 'vegetable', label: '蔬菜' },
  { value: 'dairy', label: '乳制品' },
  { value: 'other', label: '其他' },
];

export default function CreateBoxPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    imageUrl: '',
  });
  
  // 图片上传状态
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // 表单错误状态
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 处理图片选择
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 验证文件类型
      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        setErrors(prev => ({ ...prev, image: '只支持JPG和PNG格式' }));
        return;
      }
      
      // 验证文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: '图片大小不能超过5MB' }));
        return;
      }
      
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      
      // 清除图片错误
      if (errors.image) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.image;
          return newErrors;
        });
      }
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '请输入盲盒名称';
    }
    
    if (!formData.price) {
      newErrors.price = '请输入价格';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = '请输入有效的价格';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '请输入盲盒描述';
    }
    
    if (!formData.category) {
      newErrors.category = '请选择分类';
    }
    
    if (!imageFile && !formData.imageUrl) {
      newErrors.image = '请上传图片或提供图片URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (imageFile) {
        // 使用FormData上传图片
        const formDataObj = new FormData();
        formDataObj.append('name', formData.name);
        formDataObj.append('price', formData.price);
        formDataObj.append('description', formData.description);
        formDataObj.append('category', formData.category);
        formDataObj.append('image', imageFile);
        
        await BoxService.createBoxWithImage(formDataObj);
      } else {
        // 使用JSON方式提交
        await BoxService.createBox({
          name: formData.name,
          price: Number(formData.price),
          description: formData.description,
          category: formData.category,
          imageUrl: formData.imageUrl,
        });
      }
      
      toast.success('盲盒创建成功');
      router.push('/boxes');
    } catch (error) {
      console.error('创建盲盒失败:', error);
      toast.error('创建盲盒失败，请稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">创建新盲盒</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 名称输入 */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              盲盒名称 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="block w-full rounded-md border px-3 py-2"
              placeholder="请输入盲盒名称"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          
          {/* 价格输入 */}
          <div className="space-y-2">
            <label htmlFor="price" className="block text-sm font-medium">
              价格 (¥) <span className="text-red-500">*</span>
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              className="block w-full rounded-md border px-3 py-2"
              placeholder="请输入价格"
            />
            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
          </div>
          
          {/* 分类选择 */}
          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium">
              分类 <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="block w-full rounded-md border px-3 py-2"
            >
              <option value="">请选择分类</option>
              {CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
          </div>
          
          {/* 描述输入 */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium">
              描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="block w-full rounded-md border px-3 py-2"
              placeholder="请输入盲盒描述"
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>
          
          {/* 图片上传 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              图片 <span className="text-red-500">*</span>
            </label>
            
            <div className="flex space-x-2">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2">上传图片:</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageChange}
                  className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:px-3 file:py-2"
                />
                {previewUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">预览:</p>
                    <img 
                      src={previewUrl} 
                      alt="预览" 
                      className="h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
              
              <div className="text-center">或</div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2">输入图片URL:</p>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="text"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="block w-full rounded-md border px-3 py-2"
                  placeholder="https://example.com/image.jpg"
                  disabled={!!imageFile}
                />
              </div>
            </div>
            
            {errors.image && <p className="text-sm text-red-500">{errors.image}</p>}
          </div>
          
          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-md border"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-primary text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : '创建盲盒'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 