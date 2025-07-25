import { API_URLS } from '@/conf/env'
import { apiService } from '@/lib/api'

export interface TaskComment {
  id: string;
  task_id: string;
  submission_id: string;
  user_id: string;
  username: string;
  avatar: string;
  content: string;
  parent_id?: string;
  likes: number;
  reply_count: number;
  created_at: string;
  replies?: TaskComment[];
  is_liked?: boolean; // 新增：用户是否已点赞
}

export interface Task {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  deadline: string;
  reward: number;
  image?: string;
  tags?: string;
}

export async function getTasks(): Promise<Task[]> {
  try {
    const data = await apiService.get<any>(API_URLS.TASK.LIST)
    let tasks: Task[] = [];
    if (Array.isArray(data.data)) {
      tasks = data.data as Task[]
    } else {
      // 兼容 mock 数据
      tasks = data as Task[]
    }
    // 格式化截止日期
    return tasks.map(task => ({
      ...task,
      deadline: formatDateToYMD(task.deadline)
    }))
  } catch (error) {
    console.error('获取任务列表失败:', error)
    throw new Error('获取任务列表失败')
  }
}

// 工具函数：格式化 ISO/TZ 日期为 YYYY-MM-DD
function formatDateToYMD(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr; // fallback
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 创建任务
export async function createTask(payload: Partial<Task> & { deadline: string }): Promise<Task> {
  try {
    const payloadToSend: any = { ...payload }
    if (payloadToSend.reward !== undefined) {
      payloadToSend.reward = String(payloadToSend.reward)
    }
    // 新增：如果 tags 是数组，序列化为 JSON 字符串
    if (Array.isArray(payloadToSend.tags)) {
      payloadToSend.tags = JSON.stringify(payloadToSend.tags)
    }
    const data = await apiService.post<any>(API_URLS.TASK.CREATE, payloadToSend)
    return data.data as Task
  } catch (error) {
    console.error('创建任务失败:', error)
    throw new Error('创建任务失败')
  }
}

// 更新任务
export async function updateTask(taskId: string, payload: Partial<Task>): Promise<void> {
  try {
    const payloadToSend: any = { ...payload }
    if (payloadToSend.reward !== undefined) {
      payloadToSend.reward = String(payloadToSend.reward)
    }
    // 新增：如果 tags 是数组，序列化为 JSON 字符串
    if (Array.isArray(payloadToSend.tags)) {
      payloadToSend.tags = JSON.stringify(payloadToSend.tags)
    }
    await apiService.put(API_URLS.TASK.UPDATE(taskId), payloadToSend)
  } catch (error) {
    console.error('更新任务失败:', error)
    throw new Error('更新任务失败')
  }
}

// 删除任务
export async function deleteTask(taskId: string): Promise<void> {
  try {
    await apiService.delete(API_URLS.TASK.DELETE(taskId))
  } catch (error) {
    console.error('删除任务失败:', error)
    throw new Error('删除任务失败')
  }
}


// 获取任务提交列表（后端）
export async function getTaskSubmissions(taskId: string): Promise<any[]> {
  try {
    const data = await apiService.get<any>(API_URLS.TASK.SUBMISSIONS(taskId))
    // 兼容后端返回格式
    if (Array.isArray(data.data)) {
      // 需要将 images 字段从 JSON 字符串转为数组
      return data.data.map((item: any) => ({
        ...item,
        images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images,
      }))
    }
    return []
  } catch (error) {
    console.error('获取任务提交失败:', error)
    throw new Error('获取任务提交失败')
  }
}

// 获取提交的评论列表
export async function getSubmissionComments(taskId: string, submissionId: string): Promise<TaskComment[]> {
  try {
    const data = await apiService.get<any>(API_URLS.TASK.COMMENTS(taskId, submissionId))
    return data.data || []
  } catch (error) {
    console.error('获取评论失败:', error)
    throw new Error('获取评论失败')
  }
}

// 创建评论
export async function createComment(taskId: string, submissionId: string, content: string, parentId?: string): Promise<TaskComment> {
  try {
    const data = await apiService.post<any>(API_URLS.TASK.COMMENTS(taskId, submissionId), {
      task_id: taskId,
      content,
      parent_id: parentId
    })
    return data.data
  } catch (error) {
    console.error('创建评论失败:', error)
    throw new Error('创建评论失败')
  }
}

// 删除评论
export async function deleteComment(taskId: string, submissionId: string, commentId: string): Promise<void> {
  try {
    await apiService.delete(API_URLS.TASK.COMMENT_DETAIL(taskId, submissionId, commentId))
  } catch (error) {
    console.error('删除评论失败:', error)
    throw new Error('删除评论失败')
  }
}

// 点赞评论
export async function likeComment(taskId: string, submissionId: string, commentId: string): Promise<TaskComment> {
  try {
    const data = await apiService.post<any>(API_URLS.TASK.COMMENT_DETAIL(taskId, submissionId, commentId) + '/like')
    return data.data
  } catch (error) {
    console.error('点赞评论失败:', error)
    throw new Error('点赞评论失败')
  }
}

// 取消点赞评论
export async function unlikeComment(taskId: string, submissionId: string, commentId: string): Promise<TaskComment> {
  try {
    const data = await apiService.post<any>(API_URLS.TASK.COMMENT_DETAIL(taskId, submissionId, commentId) + '/unlike')
    return data.data
  } catch (error) {
    console.error('取消点赞评论失败:', error)
    throw new Error('取消点赞评论失败')
  }
}

// 上传任务封面图片
export async function uploadTaskCover(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)

  try {
    const response = await fetch(API_URLS.UPLOAD.WITH_TYPE('task'), {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('上传失败')
    }

    const data = await response.json()
    if (data.code === 200 && data.data?.url) {
      return data.data.url
    }
    throw new Error(data.msg || '上传失败')
  } catch (error) {
    console.error('上传任务封面失败:', error)
    throw new Error('上传任务封面失败')
  }
}

// 提交任务作品
export async function createTaskSubmission(taskId: string, payload: { title: string; description: string; images: string[] }): Promise<any> {
  try {
    // 需登录，token 自动加在 header
    const data = await apiService.post<any>(API_URLS.TASK.SUBMISSIONS(taskId), payload)
    return data.data
  } catch (error) {
    console.error('提交任务作品失败:', error)
    throw new Error('提交任务作品失败')
  }
}

// 获取任务详情
export interface TaskDetail {
  id: string;
  title: string;
  description: string;
  difficulty?: string;
  participants?: number;
  deadline: string;
  tags: string[];
  image?: string;
  rewards?: string;
  status?: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    status?: string;
  }>;
}

export async function getTaskDetail(taskId: string): Promise<TaskDetail> {
  try {
    const data = await apiService.get<any>(API_URLS.TASK.DETAIL(taskId));
    return data.data || data;
  } catch (error) {
    console.error('获取任务详情失败:', error);
    throw new Error('获取任务详情失败');
  }
}

// 加入挑战
export async function joinTask(taskId: string): Promise<void> {
  try {
    await apiService.post(API_URLS.TASK.UPDATE_STATUS(taskId), { status: 'in_progress' });
  } catch (error) {
    console.error('加入挑战失败:', error);
    throw new Error('加入挑战失败');
  }
}

// 任务步骤相关接口
export interface TaskStep {
  id: number;
  task_id: string;
  title: string;
  description: string;
  type: 'purchase' | 'create' | 'submit' | 'other';
  status?: 'not_started' | 'in_progress' | 'completed';
  order: number;
  created_at: string;
  updated_at: string;
}

// 获取任务步骤列表
export async function getTaskSteps(taskId: string): Promise<TaskStep[]> {
  try {
    const data = await apiService.get<any>(API_URLS.TASK.STEPS(taskId));
    return data.data || [];
  } catch (error) {
    console.error('获取任务步骤失败:', error);
    throw new Error('获取任务步骤失败');
  }
}

// 获取单个任务步骤
export async function getTaskStep(taskId: string, stepId: number): Promise<TaskStep> {
  try {
    const data = await apiService.get<any>(API_URLS.TASK.STEP_DETAIL(taskId, stepId.toString()));
    return data.data;
  } catch (error) {
    console.error('获取任务步骤失败:', error);
    throw new Error('获取任务步骤失败');
  }
}

// 创建任务步骤
export async function createTaskStep(taskId: string, payload: {
  title: string;
  description?: string;
  type: TaskStep['type'];
  order?: number;
}): Promise<TaskStep> {
  try {
    const data = await apiService.post<any>(API_URLS.TASK.STEPS(taskId), payload);
    return data.data;
  } catch (error) {
    console.error('创建任务步骤失败:', error);
    throw new Error('创建任务步骤失败');
  }
}

// 更新任务步骤
export async function updateTaskStep(taskId: string, stepId: number, payload: Partial<{
  title: string;
  description: string;
  type: TaskStep['type'];
  order: number;
}>): Promise<void> {
  try {
    await apiService.put(API_URLS.TASK.STEP_DETAIL(taskId, stepId.toString()), payload);
  } catch (error) {
    console.error('更新任务步骤失败:', error);
    throw new Error('更新任务步骤失败');
  }
}

// 删除任务步骤
export async function deleteTaskStep(taskId: string, stepId: number): Promise<void> {
  try {
    await apiService.delete(API_URLS.TASK.STEP_DETAIL(taskId, stepId.toString()));
  } catch (error) {
    console.error('删除任务步骤失败:', error);
    throw new Error('删除任务步骤失败');
  }
}

// 更新任务步骤状态
export async function updateTaskStepStatus(taskId: string, stepId: number, status: TaskStep['status']): Promise<void> {
  try {
    await apiService.put(API_URLS.TASK.STEP_DETAIL(taskId, stepId.toString()) + '/status', { status });
  } catch (error) {
    console.error('更新任务步骤状态失败:', error);
    throw new Error('更新任务步骤状态失败');
  }
}

// 重新排序任务步骤
export async function reorderTaskSteps(taskId: string, stepOrders: Record<number, number>): Promise<void> {
  try {
    await apiService.put(API_URLS.TASK.STEPS(taskId) + '/reorder', { step_orders: stepOrders });
  } catch (error) {
    console.error('重新排序任务步骤失败:', error);
    throw new Error('重新排序任务步骤失败');
  }
}

// 获取任务步骤进度
export async function getTaskStepProgress(taskId: string): Promise<{
  total_steps: number;
  completed_steps: number;
  in_progress_steps: number;
  progress: number;
  steps: TaskStep[];
}> {
  try {
    const data = await apiService.get<any>(API_URLS.TASK.STEP_PROGRESS(taskId));
    return data.data;
  } catch (error) {
    console.error('获取任务步骤进度失败:', error);
    throw new Error('获取任务步骤进度失败');
  }
}
