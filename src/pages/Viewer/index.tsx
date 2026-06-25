import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { bookService } from '../../entities/book';
import type { IBook } from '../../entities/book';
import { annotationService } from '../../entities/annotation';
import type { Annotation } from '../../entities/annotation';
import styles from './Viewer.module.css';
import './OxfordDictionary.css';
import { Header } from '../../widgets/Header';
import { Sidebar } from '../../widgets/Sidebar';
import { TranslationPopup } from '../../features/translation-popup';
import { AnnotationsPanel } from '../../features/annotations/ui/AnnotationsPanel';
import { useEpubReader } from '../../features/epub-reader/lib/useEpubReader';

const Viewer: React.FC = () => {
  const { id } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const isTranslatingRef = useRef<boolean>(false);

  const [book, setBook] = useState<IBook | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebarLeft, setShowSidebarLeft] = useState(true);
  const [translationEnabled, setTranslationEnabled] = useState(true);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showAnnotationsPanel, setShowAnnotationsPanel] = useState(false);
  const [annotationCfi, setAnnotationCfi] = useState<string | undefined>(undefined);
  const [annotationText, setAnnotationText] = useState<string | undefined>(undefined);

  const persistedSelectionRef = useRef<{ word: string; context: string; cfi?: string }>({
    word: '',
    context: '',
    cfi: undefined
  });
  const [persistedSelection, setPersistedSelection] = useState(persistedSelectionRef.current);

  const handleTextSelected = useCallback((word: string, context: string, cfiRange?: string) => {
    if (word && word.trim()) {
      persistedSelectionRef.current = { word, context, cfi: cfiRange };
      setPersistedSelection({ word, context, cfi: cfiRange });
    }
  }, []);

  const handleAnnotationClick = useCallback((cfi: string, annotationId: number) => {
    setAnnotationCfi(cfi);
    setShowAnnotationsPanel(true);

    const annotation = annotations.find(a => a.id === annotationId);
    if (annotation) {
      setAnnotationText(annotation.position);
    }
  }, [annotations]);

  const { outline, prev, next, goTo, addAnnotationMarker, removeAnnotationMarker } = useEpubReader({
    containerRef,
    bookPath: book?.path ?? null,
    onTextSelected: handleTextSelected,
    onAnnotationClick: handleAnnotationClick
  });

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    bookService.getBookById(parseInt(id))
      .then(bookData => {
        if (!bookData) return Promise.reject(new Error('Book not found'));
        setBook(bookData);
        return annotationService.getAnnotations(bookData.id);
      })
      .then(data => {
        setAnnotations(data);
      })
      .catch(err => console.warn('Failed to load book:', err))
      .finally(() => setIsLoading(false));

    return () => setBook(null);
  }, [id]);

  useEffect(() => {
    if (!book) return;
    annotations.forEach(annotation => {
      if (annotation.cfi) {
        addAnnotationMarker(annotation.cfi, annotation.id);
      }
    });
  }, [annotations, addAnnotationMarker]);

  useEffect(() => {
    if (!translationEnabled && persistedSelection.cfi && persistedSelection.word) {
      setAnnotationCfi(persistedSelection.cfi);
      setAnnotationText(persistedSelection.word);
      setShowAnnotationsPanel(true);
    }
  }, [translationEnabled, persistedSelection.cfi, persistedSelection.word]);

  const handleClearPersistedSelection = useCallback(() => {
    persistedSelectionRef.current = { word: '', context: '', cfi: undefined };
    setPersistedSelection({ word: '', context: '', cfi: undefined });
  }, []);

  const handleClosePopup = useCallback(() => {
  }, []);

  const handleTranslationChange = useCallback((translating: boolean) => {
    isTranslatingRef.current = translating;
  }, []);

  const handleToggleTranslation = useCallback(() => {
    setTranslationEnabled(prev => !prev);
  }, []);

  const handleToggleAnnotationsPanel = useCallback(() => {
    setShowAnnotationsPanel(prev => !prev);
  }, []);

  const handleCloseAnnotationsPanel = useCallback(() => {
    setShowAnnotationsPanel(false);
    setAnnotationCfi(undefined);
    setAnnotationText(undefined);
  }, []);

  const handleAnnotationCreated = useCallback((_cfi: string) => {
    if (book) {
      annotationService.getAnnotations(book.id).then(data => {
        setAnnotations(data);
      });
    }
    handleClearPersistedSelection();
  }, [book, handleClearPersistedSelection]);

  const handleAnnotationDeleted = useCallback((_cfi: string) => {
    removeAnnotationMarker(_cfi);
    if (book) {
      annotationService.getAnnotations(book.id).then(data => {
        setAnnotations(data);
      });
    }
  }, [book, removeAnnotationMarker]);

  if (!id) {
    return (
      <div className={styles.viewerContainer}>
        <div className={styles.loadingMessage}>No book ID provided</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.viewerContainer}>
        <div className={styles.loadingMessage}>Loading book...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className={styles.viewerContainer}>
        <div className={styles.loadingMessage}>Book not found</div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <Header
        showSidebarLeft={showSidebarLeft}
        onToggleSidebar={() => setShowSidebarLeft(prev => !prev)}
        onToggleBookmarks={handleToggleAnnotationsPanel}
        translationEnabled={translationEnabled}
        onToggleTranslation={handleToggleTranslation}
      />

      <div className={styles.mainContent}>
        <Sidebar
          outline={outline}
          showSidebarLeft={showSidebarLeft}
          onPageClick={goTo}
        />

        <main className={styles.epubMain} id="epub-viewer">
          <div ref={containerRef} className={styles.container}>
            <div className={styles.pageNavigation}>
              <button className={styles.navBtn} onClick={prev}>‹</button>
              <button className={styles.navBtn} onClick={next}>›</button>
            </div>
          </div>
        </main>

        <AnnotationsPanel
          isVisible={showAnnotationsPanel}
          bookId={book.id}
          selectedCfi={annotationCfi}
          selectedText={annotationText}
          selectedContext={annotationText}
          onClose={handleCloseAnnotationsPanel}
          onAnnotationCreated={handleAnnotationCreated}
          onAnnotationDeleted={handleAnnotationDeleted}
        />
      </div>

      {translationEnabled && (
        <TranslationPopup
          selectedWord={persistedSelection.word}
          context={persistedSelection.context}
          bookId={book.id}
          onClose={handleClosePopup}
          onTranslatingChange={handleTranslationChange}
        />
      )}
    </div>
  );
};

export default Viewer;