import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { bookService } from '../../services/bookService';
import type { Book } from '../../types/book';
import styles from './Viewer.module.css';
import './LongmanDictionaryOfContemporaryEnglish6thEnEn.css';
import EpubViewer from './components/EpubViewer';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TranslationPopup from './components/TranslationPopup';

const Viewer: React.FC = () => {
  const { id } = useParams();
  const epubViewerRef = useRef<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [book, setBook] = useState<Book | undefined>(undefined);
  const [isBookLoading, setIsBookLoading] = useState<boolean>(true);
  const [outline, setOutline] = useState<any[]>([]);
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showSidebarLeft, setShowSidebarLeft] = useState<boolean>(true);
  const isTranslatingRef = useRef<boolean>(false);

  // Click outside to deselect text
  useEffect(() => {
    const handleClickOutside = () => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        setSelectedWord('');
      }
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        setSelectedWord('');
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Load book data
  useEffect(() => {
    if (!id) {
      setIsBookLoading(false);
      return;
    }

    const fetchBook = async () => {
      setIsBookLoading(true);
      const fetchedBook = await bookService.getBookById(parseInt(id));
      if (fetchedBook) {
        setBook(fetchedBook);
      } else {
        setBook(undefined);
      }
      setIsBookLoading(false);
    };

    fetchBook();
  }, [id]);

  // EPUB selected text handler
  const handleEpubSelectedText = useCallback((text: string, context?: string) => {
    if (isTranslatingRef.current) return;
    if (text.trim().length > 0) {
      setSelectedWord(text.trim());
      setSelectedContext(context || '');
    }
  }, []);

  // Translation state change handler
  const handleTranslationChange = useCallback((translating: boolean) => {
    isTranslatingRef.current = translating;
  }, []);

  // Navigation handlers
  const handlePrevPage = useCallback(() => {
    if (epubViewerRef.current) {
      epubViewerRef.current.prev();
      setCurrentPage(prev => Math.max(1, prev - 1));
    }
  }, []);

  const handleNextPage = useCallback(() => {
    if (epubViewerRef.current) {
      epubViewerRef.current.next();
    } else {
      setCurrentPage(prev => Math.min(numPages, prev + 1));
    }
  }, [numPages]);

  // EPUB load success
  const onEpubLoadSuccess = useCallback(async (_book: any) => {
    setIsBookLoading(false);
    try {
      if (epubViewerRef.current) {
        const toc = await epubViewerRef.current.getOutline();
        const processOutline = (items: any[]): any[] => {
          return items.map(item => ({
            title: item.label,
            dest: item.href,
            items: item.subitems && item.subitems.length > 0
              ? processOutline(item.subitems)
              : undefined
          }));
        };
        setOutline(processOutline(toc));
      }
    } catch (error) {
      console.warn('Could not get EPUB outline:', error);
      setOutline([]);
    }
  }, []);

  if (!id) {
    return (
      <div className={styles.viewerContainer}>
        <div className={styles.loadingMessage}>No book ID provided</div>
      </div>
    );
  }

  if (isBookLoading) {
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

  const epubUrl = book.path;

  return (
    <div className={styles.app}>
      <Header
        book={book}
        numPages={numPages}
        currentPage={currentPage}
        showSidebarLeft={showSidebarLeft}
        onToggleSidebar={() => setShowSidebarLeft(!showSidebarLeft)}
      />

      <div className={styles.mainContent}>
        <Sidebar
          outline={outline}
          showSidebarLeft={showSidebarLeft}
          onToggleSidebar={() => setShowSidebarLeft(!showSidebarLeft)}
          onPageClick={(dest) => {
            if (epubViewerRef.current) {
              try {
                epubViewerRef.current.goTo(dest);
              } catch (err) {
                console.warn('EPUB navigation failed:', err);
              }
            }
          }}
        />

        <main className={styles.epubMain} id="epub-viewer">
          <EpubViewer
            ref={epubViewerRef}
            file={epubUrl}
            onSelectedText={handleEpubSelectedText}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            onLoadSuccess={onEpubLoadSuccess}
            onPageChange={(page, total) => {
              setCurrentPage(page);
              setNumPages(total);
            }}
          />
        </main>
      </div>

      <TranslationPopup
        selectedWord={selectedWord}
        context={selectedContext}
        bookId={book?.id}
        onClose={() => {
          setSelectedWord('');
          setSelectedContext('');
        }}
        onTranslatingChange={handleTranslationChange}
      />
    </div>
  );
};

export default Viewer;
