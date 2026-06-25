import { useState } from 'react';
import { Input } from 'antd';
import styles from './AnnotationsPanel.module.css';

const { TextArea } = Input;

interface AnnotationFormProps {
  selectedText?: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  isSubmitting?: boolean;
  editContent?: string;
  mode?: 'create' | 'edit';
}

export function AnnotationForm({
  selectedText,
  onSubmit,
  onCancel,
  submitText = '创建',
  isSubmitting = false,
  editContent,
  mode = 'create',
}: AnnotationFormProps) {
  const [content, setContent] = useState(editContent || '');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    await onSubmit(content.trim());
    setContent('');
  };

  return (
    <div className={styles.annotationForm}>
      {selectedText && mode === 'create' && (
        <div className={styles.selectedTextPreview}>
          <span className={styles.label}>选中的文字:</span>
          <p className={styles.preview}>{selectedText}</p>
        </div>
      )}
      <TextArea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={mode === 'create' ? '输入注解内容...' : '编辑注解内容...'}
        rows={3}
        className={styles.input}
      />
      <div className={styles.formActions}>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? '提交中...' : submitText}
        </button>
        {onCancel && (
          <button
            className={styles.cancelBtn}
            onClick={() => {
              setContent('');
              onCancel();
            }}
          >
            取消
          </button>
        )}
      </div>
    </div>
  );
}