import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}) {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(d)
}

/**
 * 安全解析JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch (e) {
    return fallback
  }
}

/**
 * 深度合并对象
 */
export function deepMerge<T extends object = object>(
  target: T,
  source: Partial<T>
): T {
  const output = { ...target }

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key as keyof T])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key as keyof T] })
        } else {
          output[key as keyof T] = deepMerge(
            target[key as keyof T] as any,
            source[key as keyof T] as any
          )
        }
      } else {
        Object.assign(output, { [key]: source[key as keyof T] })
      }
    })
  }

  return output
}

/**
 * 判断是否为对象
 */
export function isObject(item: any): item is object {
  return item !== null && typeof item === 'object' && !Array.isArray(item)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 生成唯一ID
 */
export function generateId(length = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
}

/**
 * 从本地存储获取记忆
 */
export function getMemory<T = string>(key: string, defaultValue?: T): T | null {
  try {
    const value = localStorage.getItem(`freshbox-${key}`)
    if (value === null) {
      return defaultValue !== undefined ? defaultValue : null
    }
    return safeJsonParse(value, defaultValue !== undefined ? defaultValue : null)
  } catch (e) {
    console.error(`Error retrieving memory for key: ${key}`, e)
    return defaultValue !== undefined ? defaultValue : null
  }
}

/**
 * 设置记忆到本地存储
 */
export function setMemory<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`freshbox-${key}`, JSON.stringify(value))
  } catch (e) {
    console.error(`Error setting memory for key: ${key}`, e)
  }
}

/**
 * 格式化货币
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount);
}
