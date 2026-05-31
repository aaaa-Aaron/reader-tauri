/**
 * 图书类型定义
 */

export interface Book {
  id: number;
  title: string;
  format: 'pdf' | 'epub';
  path: string;
  uploadTime: string;
  author?: string;
  fileSize?: number;
}

export interface CreateBookRequest {
  title: string;
  format: 'pdf' | 'epub';
  filePath: string;
  author?: string;
  fileSize?: number;
}
