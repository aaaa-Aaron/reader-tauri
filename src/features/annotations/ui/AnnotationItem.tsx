import React from 'react';
import type { Annotation } from '../../../entities/annotation';
import { AnnotationForm } from './AnnotationForm';
import styles from './AnnotationsPanel.module.css';

interface AnnotationItemProps {
  annotation: Annotation;
  onEdit: (id: number, content: string) => void;
  onDelete: (id: number) => void;
}

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export function AnnotationItem({ annotation, onEdit, onDelete }: AnnotationItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleEdit = async (content: string) => {
    await onEdit(annotation.id, content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('确定要删除这条注解吗？')) {
      setIsDeleting(true);
      await onDelete(annotation.id);
      setIsDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <div className={styles.annotationItem}>
        <AnnotationForm
          editContent={annotation.content}
          mode="edit"
          submitText="保存"
          isSubmitting={false}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className={styles.annotationItem}>
      <div className={styles.annotationHeader}>
        <span className={styles.time}>{formatDate(annotation.createdAt)}</span>
      </div>
      <div className={styles.annotationContent}>{annotation.content}</div>
      <div className={styles.annotationActions}>
        <button
          className={styles.actionBtn}
          onClick={() => setIsEditing(true)}
          title="编辑"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
          编辑
        </button>
        <button
          className={styles.actionBtn}
          onClick={handleDelete}
          disabled={isDeleting}
          title="删除"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          {isDeleting ? '删除中...' : '删除'}
        </button>
      </div>
    </div>
  );
}