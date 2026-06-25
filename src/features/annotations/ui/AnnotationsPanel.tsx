import React, { useState } from 'react';
import { Pagination } from 'antd';
import { useAnnotations } from '../lib/useAnnotations';
import { AnnotationForm } from './AnnotationForm';
import { AnnotationItem } from './AnnotationItem';
import type { TabType } from './types';
import styles from './AnnotationsPanel.module.css';

const PAGE_SIZE = 5;

interface AnnotationsPanelProps {
  isVisible: boolean;
  bookId: number;
  selectedCfi?: string;
  selectedText?: string;
  selectedContext?: string;
  onClose: () => void;
  onAnnotationCreated?: (cfi: string) => void;
  onAnnotationDeleted?: (cfi: string) => void;
}

export function AnnotationsPanel({
  isVisible,
  bookId,
  selectedCfi,
  selectedText,
  selectedContext,
  onClose,
  onAnnotationCreated,
  onAnnotationDeleted,
}: AnnotationsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('annotations');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { annotations, loading, createAnnotation, updateAnnotation, deleteAnnotation } = useAnnotations({
    bookId,
    cfi: activeTab === 'annotations' ? selectedCfi : undefined,
    enabled: isVisible,
  });

  // Show create form when text selected and no annotations exist
  React.useEffect(() => {
    if (selectedCfi && selectedText && annotations.length === 0 && !loading) {
      setShowCreateForm(true);
    } else {
      setShowCreateForm(false);
    }
  }, [selectedCfi, selectedText, annotations.length, loading]);

  const handleCreate = async (content: string) => {
    if (!bookId || !selectedCfi) return;
    setIsCreating(true);
    try {
      const result = await createAnnotation(content, selectedContext || selectedCfi, selectedCfi);
      if (result) {
        setShowCreateForm(false);
        onAnnotationCreated?.(result.cfi || selectedCfi);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteAnnotation(id);
    onAnnotationDeleted?.(selectedCfi || '');
  };

  const paginatedAnnotations = annotations.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(annotations.length / PAGE_SIZE);

  if (!isVisible) return null;

  const isEmptyState = !selectedCfi;

  return (
    <aside className={styles.sidebar}>
      <header className={styles.header}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'annotations' ? styles.active : ''}`}
            onClick={() => setActiveTab('annotations')}
          >
            注解
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            对话
          </button>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      <main className={styles.content}>
        {activeTab === 'annotations' ? (
          <div className={styles.annotationSection}>
            {/* Create annotation form */}
            {showCreateForm && selectedText && (
              <AnnotationForm
                selectedText={selectedText}
                onSubmit={handleCreate}
                isSubmitting={isCreating}
                submitText="创建注解"
              />
            )}

            {/* Add annotation button */}
            {selectedCfi && selectedText && annotations.length > 0 && !showCreateForm && (
              <button
                className={styles.addBtn}
                onClick={() => setShowCreateForm(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                继续添加注解
              </button>
            )}

            {/* Loading */}
            {loading && <div className={styles.loading}>加载中...</div>}

            {/* Empty state */}
            {!loading && isEmptyState && (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <p className={styles.emptyText}>请点击带下划线的文字查看注解</p>
              </div>
            )}

            {/* No annotations */}
            {!loading && !isEmptyState && annotations.length === 0 && !showCreateForm && (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>该位置暂无注解</p>
              </div>
            )}

            {/* Annotation list */}
            {!loading && paginatedAnnotations.length > 0 && (
              <div className={styles.annotationList}>
                {paginatedAnnotations.map(annotation => (
                  <AnnotationItem
                    key={annotation.id}
                    annotation={annotation}
                    onEdit={updateAnnotation}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className={styles.pagination}>
                <Pagination
                  current={currentPage}
                  total={annotations.length}
                  pageSize={PAGE_SIZE}
                  onChange={page => setCurrentPage(page)}
                  simple
                />
              </div>
            )}
          </div>
        ) : (
          <div className={styles.commentList}>
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>对话功能开发中...</p>
            </div>
          </div>
        )}
      </main>
    </aside>
  );
}