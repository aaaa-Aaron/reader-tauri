import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { bookService } from '../../services/bookService';
import type { IBook } from '../../types/book';
import styles from './Viewer.module.css';
import './LongmanDictionaryOfContemporaryEnglish6thEnEn.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TranslationPopup from './components/TranslationPopup';
import { useEpubReader } from '../../hooks/useEpubReader';

const Viewer: React.FC = () => {
  const { id } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const isTranslatingRef = useRef<boolean>(false);

  const [book, setBook] = useState<IBook | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebarLeft, setShowSidebarLeft] = useState(true);
  const [selectedWord, setSelectedWord] = useState('');
  const [selectedContext, setSelectedContext] = useState('');

  const handleTextSelected = useCallback((word: string, context: string) => {
    setSelectedWord(word);
    setSelectedContext(context);
  }, []);

  const { outline, prev, next, goTo } = useEpubReader({
    containerRef,
    bookPath: book?.path ?? null,
    onTextSelected: handleTextSelected
  });

  // 加载书籍元数据
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    bookService.getBookById(parseInt(id))
      .then(book => {
        setBook(book);
      })
      .catch(err => console.warn('Failed to load book:', err))
      .finally(() => setIsLoading(false));

    return () => setBook(null);
  }, [id]);

  const handleToggleSidebar = useCallback(() => {
    setShowSidebarLeft(prev => !prev);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedWord('');
    setSelectedContext('');
  }, []);

  const handleTranslationChange = useCallback((translating: boolean) => {
    isTranslatingRef.current = translating;
  }, []);

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
        onToggleSidebar={handleToggleSidebar}
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
      </div>

      <TranslationPopup
        selectedWord={selectedWord}
        context={selectedContext}
        bookId={book.id}
        onClose={handleClosePopup}
        onTranslatingChange={handleTranslationChange}
      />
    </div>
  );
};

export default Viewer;
