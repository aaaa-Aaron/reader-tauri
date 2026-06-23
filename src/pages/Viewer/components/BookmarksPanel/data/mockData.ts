import type { Bookmark, Comment } from '../types';

// Mock 书签数据
export const mockBookmarks: Bookmark[] = [
  {
    id: '1',
    content: '这是一段很重要的观点，需要重点关注：Code Review 等协作环节耗时下降',
    position: '第二章 - AI Coding 对人才结构的影响',
    createdAt: '2024-03-22 09:51',
    user: {
      name: '李润潮',
      avatar: 'L'
    }
  },
  {
    id: '2',
    content: '效率传导的四个层级这个概念很有意思，值得深入思考',
    position: '第三章 - 人才结构和能力模型的演进',
    createdAt: '2024-03-23 10:48',
    user: {
      name: '李润潮',
      avatar: 'L'
    }
  },
  {
    id: '3',
    content: '企业战略层面的变化是最终目标',
    position: '第四章 - 企业战略层面',
    createdAt: '2024-03-24 14:20',
    user: {
      name: '李润潮',
      avatar: 'L'
    }
  }
];

// Mock 评论数据
export const mockComments: Comment[] = [
  {
    id: '1',
    content: '为什么有的人反馈反而需要花更多的时间检查 AI 写的代码有没有问题呢？是他们不会用 AI 吗？',
    createdAt: '2024-03-24 09:51',
    user: {
      name: '李润潮',
      avatar: 'L'
    },
    replies: [
      {
        id: '1-1',
        content: '总的时间实际是优化的，但是工程师的工作内容确实发生了变化。',
        createdAt: '2024-03-24 10:48',
        user: {
          name: '南斌',
          avatar: 'N'
        }
      }
    ]
  },
  {
    id: '2',
    content: '效率传导的四个层级这个模型很有启发性',
    createdAt: '2024-03-25 11:30',
    user: {
      name: '南斌',
      avatar: 'N'
    }
  }
];
