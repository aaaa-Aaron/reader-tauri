/**
 * 图书服务层 - 调用Tauri Command
 */

import { invoke } from '@tauri-apps/api/core';
import type { Book, CreateBookRequest } from '../types/book';

export const bookService = {
  /**
   * 获取所有图书
   */
  async getAllBooks(): Promise<Book[]> {
    return await invoke<Book[]>('get_all_books');
  },

  /**
   * 根据ID获取图书
   */
  async getBookById(id: number): Promise<Book | null> {
    return await invoke<Book | null>('get_book_by_id', { id });
  },

  /**
   * 创建图书记录
   */
  async createBook(request: CreateBookRequest): Promise<Book> {
    return await invoke<Book>('create_book', { request });
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
  async searchBooks(query: string): Promise<Book[]> {
    return await invoke<Book[]>('search_books', { query });
  }
};
