import React from 'react';
import { useEpubReader } from '../lib/useEpubReader';
import styles from './EpubContent.module.css';

interface EpubContentProps {
  bookPath: string | null;
  onTextSelected?: (word: string, context: string, cfiRange?: string) => void;
  onAnnotationClick?: (cfi: string, annotationId: number) => void;
  annotations?: { cfi: string; id: number }[];
}

const EpubContent = ({
  bookPath,
  onTextSelected,
  onAnnotationClick,
  annotations = []
}: EpubContentProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { outline, prev, next, goTo, addAnnotationMarker, removeAnnotationMarker } = useEpubReader({
    containerRef,
    bookPath,
    onTextSelected,
    onAnnotationClick
  });

  React.useEffect(() => {
    annotations.forEach(annotation => {
      if (annotation.cfi) {
        addAnnotationMarker(annotation.cfi, annotation.id);
      }
    });
  }, [annotations, addAnnotationMarker]);

  return {
    outline,
    prev,
    next,
    goTo,
    removeAnnotationMarker,
    component: (
      <div ref={containerRef} className={styles.container}>
        <div className={styles.pageNavigation}>
          <button className={styles.navBtn} onClick={prev}>‹</button>
          <button className={styles.navBtn} onClick={next}>›</button>
        </div>
      </div>
    )
  };
};

export default EpubContent;