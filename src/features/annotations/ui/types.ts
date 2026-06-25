export interface User {
  name: string;
  avatar: string;
}

export interface Comment {
  id: string;
  user: User;
  content: string;
  createdAt: string;
}

export type TabType = 'annotations' | 'comments';