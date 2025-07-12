import { API_URLS } from '@/conf/env'
import type { TaskSubmission } from './task-mock'

// 获取任务提交列表（后端）
export async function getTaskSubmissions(taskId: string): Promise<TaskSubmission[]> {
  const res = await fetch(API_URLS.TASK.SUBMISSIONS(taskId), {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('获取任务提交失败')
  const data = await res.json()
  // 兼容后端返回格式
  if (Array.isArray(data.data)) {
    // 需要将 images 字段从 JSON 字符串转为数组
    return data.data.map((item: any) => ({
      ...item,
      images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images,
    }))
  }
  return []
}
