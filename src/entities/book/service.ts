/**
 * 图书服务层 - 调用Tauri Command
 */

import { invoke } from '@tauri-apps/api/core';
import type { IBook } from './types';

interface CreateBookRequest {
  title: string;
  author?: string;
  cover?: string;
  path?: string;
  fileType?: 'epub' | 'pdf';
  format?: 'epub' | 'pdf';
  filePath?: string;
  fileSize?: number;
}

interface UpdateBookRequest {
  id: number;
  progress?: number;
  lastReadAt?: string;
}

export const bookService = {
  /**
   * 获取所有图书
   */
  async getAllBooks(): Promise<IBook[]> {
    return await invoke<IBook[]>('get_all_books');
  },

  /**
   * 根据ID获取图书
   */
  async getBookById(id: number): Promise<IBook | null> {
    return await invoke<IBook | null>('get_book_by_id', { id });
  },

  /**
   * 创建图书记录
   */
  async createBook(request: CreateBookRequest): Promise<IBook> {
    return await invoke<IBook>('create_book', { request });
  },

  /**
   * 更新图书记录
   */
  async updateBook(request: UpdateBookRequest): Promise<IBook> {
    return await invoke<IBook>('update_book', { request });
  },

  /**
   * 删除图书
   */
  async deleteBook(id: number): Promise<void> {
    return await invoke('delete_book', { id });
  },

  /**
   * 搜索图书
   */
  async searchBooks(query: string): Promise<IBook[]> {
    return await invoke<IBook[]>('search_books', { query });
  }
};
