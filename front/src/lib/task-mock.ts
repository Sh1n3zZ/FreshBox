// 任务简要信息接口
export interface TaskInfo {
  id: string;
  title: string;
  image: string;
}

// 挑战步骤接口
export interface TaskStep {
  id: number;
  title: string;
  description: string;
  type: 'purchase' | 'create' | 'submit' | 'other';
  status?: 'not_started' | 'in_progress' | 'completed';
}

// 挑战详情接口
export interface TaskDetail {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  participants: number;
  deadline: string;
  tags: string[];
  image: string;
  steps: TaskStep[];
  rewards: string;
  status?: 'not_started' | 'in_progress' | 'completed';
}

// 挑战结果接口
export interface TaskSubmission {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  title: string;
  description: string;
  images: string[];
  likes: number;
  comments: number;
  createdAt: string;
}

// Mock数据
export const mockTaskInfo: TaskInfo = {
  id: '1',
  title: "夏日清凉料理挑战",
  image: "/images/challenge1.jpg"
};

// Mock数据
export const mockTaskDetail: TaskDetail = {
  id: '1',
  title: "夏日清凉料理挑战",
  description: "使用盲盒食材制作清爽的夏日料理，赢取丰厚奖励",
  difficulty: "easy",
  participants: 246,
  deadline: "2024-08-31",
  tags: ["夏季限定", "清凉料理"],
  image: "/images/ximilu.jpg",
  rewards: "300积分 + 限定徽章",
  status: "not_started",
  steps: [
    {
      id: 1,
      title: "购买夏日限定盲盒",
      description: "购买并开启一个夏日限定盲盒，使用里面的食材完成挑战",
      type: "purchase",
      status: "not_started"
    },
    {
      id: 2,
      title: "创作料理",
      description: "使用盲盒中的食材创作一道清爽的夏日料理",
      type: "create",
      status: "not_started"
    },
    {
      id: 3,
      title: "提交作品",
      description: "上传您的料理照片及制作过程",
      type: "submit",
      status: "not_started"
    }
  ]
};

export const mockSubmissions: TaskSubmission[] = [
  {
    id: '1',
    userId: 'user1',
    username: 'SkyFrost',
    avatar: '/images/zjh.jpg',
    title: '薄荷柠檬凉拌蔬菜',
    description: '使用盲盒中的小黄瓜、胡萝卜和薄荷叶，加入柠檬汁调味，清爽可口！',
    images: ['/images/bohe.jpg'],
    likes: 86,
    comments: 12,
    createdAt: '2025-01-14'
  },
  {
    id: '2',
    userId: 'user2',
    username: 'Sh1n3ZzxCSGO',
    avatar: '/images/jdh.jpg',
    title: '水果沙拉冰淇淋',
    description: '将盲盒中的水果制成沙拉，搭配自制的酸奶冰淇淋，既健康又美味！',
    images: ['/images/saladicecream.jpg'],
    likes: 74,
    comments: 8,
    createdAt: '2023-11-18'
  },
  {
    id: '3',
    userId: 'user3',
    username: 'JimJiangOP',
    avatar: '/images/jim.jpg',
    title: '凉拌豆腐沙拉',
    description: '用盲盒中的豆腐、黄瓜和胡萝卜，加入特制酱汁，制作了一道低卡路里的夏日沙拉',
    images: ['/images/tofu.jpg'],
    likes: 62,
    comments: 15,
    createdAt: '2024-05-14'
  }
];
