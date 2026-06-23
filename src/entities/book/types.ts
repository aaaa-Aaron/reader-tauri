// 书籍实体类型定义
export interface IBook {
  id: number;
  title: string;
  author: string;
  cover?: string;
  path: string;
  progress: number;
  lastReadAt?: string;
  addedAt: string;
  fileType: 'epub' | 'pdf';
  format?: 'epub' | 'pdf';
}

export interface BookOutline {
  id: string;
  label: string;
  href: string;
  children?: BookOutline[];
}
