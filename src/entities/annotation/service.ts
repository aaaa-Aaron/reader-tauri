/**
 * 注解服务层 - 调用Tauri Command
 */

import { invoke } from '@tauri-apps/api/core';
import type { Annotation, CreateAnnotationRequest } from './types';

export const annotationService = {
  /**
   * 获取图书的注解列表
   */
  async getAnnotations(bookId: number): Promise<Annotation[]> {
    return await invoke<Annotation[]>('get_annotations', { bookId });
  },

  /**
   * 创建注解
   */
  async createAnnotation(request: CreateAnnotationRequest): Promise<Annotation> {
    return await invoke<Annotation>('create_annotation', {
      bookId: request.bookId,
      content: request.content,
      position: request.position,
      cfi: request.cfi,
    });
  },

  /**
   * 删除注解
   */
  async deleteAnnotation(id: number): Promise<void> {
    return await invoke<void>('delete_annotation', { id });
  },

  /**
   * 按CFI获取注解列表
   */
  async getAnnotationsByCfi(bookId: number, cfi: string): Promise<Annotation[]> {
    return await invoke<Annotation[]>('get_annotations_by_cfi', { bookId, cfi });
  },

  /**
   * 更新注解内容
   */
  async updateAnnotation(id: number, content: string): Promise<Annotation> {
    return await invoke<Annotation>('update_annotation', { id, content });
  },
};