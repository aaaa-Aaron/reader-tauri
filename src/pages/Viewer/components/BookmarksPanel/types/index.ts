// 书签项类型
export interface Bookmark {
  id: string;
  content: string;
  position: string;
  createdAt: string;
  user: User;
}

// 评论类型
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  replies?: Comment[];
}

// 用户信息类型
export interface User {
  name: string;
  avatar: string;
}

// 标签页类型
export type TabType = 'bookmarks' | 'comments';
