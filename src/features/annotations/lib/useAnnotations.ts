import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { annotationService } from '../../../entities/annotation';
import type { Annotation } from '../../../entities/annotation';

interface UseAnnotationsOptions {
  bookId: number;
  cfi?: string;
  enabled?: boolean;
}

export function useAnnotations({ bookId, cfi, enabled = true }: UseAnnotationsOptions) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAnnotations = useCallback(async () => {
    if (!bookId || !cfi || !enabled) {
      setAnnotations([]);
      return;
    }

    setLoading(true);
    try {
      const data = await annotationService.getAnnotationsByCfi(bookId, cfi);
      setAnnotations(data);
    } catch (error) {
      console.error('Failed to load annotations:', error);
      message.error('加载注解失败');
    } finally {
      setLoading(false);
    }
  }, [bookId, cfi, enabled]);

  const createAnnotation = useCallback(async (
    content: string,
    position: string,
    cfi?: string
  ) => {
    if (!bookId) return null;

    try {
      const newAnnotation = await annotationService.createAnnotation({
        bookId,
        content,
        position,
        cfi,
      });
      setAnnotations(prev => [newAnnotation, ...prev]);
      message.success('注解创建成功');
      return newAnnotation;
    } catch (error) {
      console.error('Failed to create annotation:', error);
      message.error('创建注解失败');
      return null;
    }
  }, [bookId]);

  const updateAnnotation = useCallback(async (id: number, content: string) => {
    try {
      const updated = await annotationService.updateAnnotation(id, content);
      setAnnotations(prev => prev.map(a => a.id === id ? updated : a));
      message.success('注解更新成功');
    } catch (error) {
      console.error('Failed to update annotation:', error);
      message.error('更新注解失败');
    }
  }, []);

  const deleteAnnotation = useCallback(async (id: number) => {
    try {
      await annotationService.deleteAnnotation(id);
      setAnnotations(prev => prev.filter(a => a.id !== id));
      message.success('注解删除成功');
    } catch (error) {
      console.error('Failed to delete annotation:', error);
      message.error('删除注解失败');
    }
  }, []);

  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  return {
    annotations,
    loading,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    reload: loadAnnotations,
  };
}