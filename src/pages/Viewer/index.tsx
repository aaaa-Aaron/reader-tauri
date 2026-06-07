import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { bookService } from '../../services/bookService';
import type { Book } from '../../types/book';
import styles from './Viewer.module.css';
import './LongmanDictionaryOfContemporaryEnglish6thEnEn.css';
import PdfViewer from './components/PdfViewer';
import EpubViewer from './components/EpubViewer';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TranslationPopup from './components/TranslationPopup';

const Viewer: React.FC = () => {
  const { id } = useParams();
  const pdfViewerRef = useRef<any>(null);
  const epubViewerRef = useRef<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [book, setBook] = useState<Book | undefined>(undefined);
  const [isBookLoading, setIsBookLoading] = useState<boolean>(true);
  const [outline, setOutline] = useState<any[]>([]);
  const [pdfInstance, setPdfInstance] = useState<any>(null);
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showSidebarLeft, setShowSidebarLeft] = useState<boolean>(true);
  const isTranslatingRef = useRef<boolean>(false);
  const isPdf = book?.format?.toLowerCase() === 'pdf';
  const isEpub = book?.format?.toLowerCase() === 'epub';

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

  // PDF document load success
  const onDocumentLoadSuccess = useCallback(async (pdf: any) => {
    const numPages = pdf.numPages;
    setNumPages(numPages);
    setPdfInstance(pdf);

    try {
      const outline = await pdf.getOutline();

      const processOutline = (items: any[]): any[] => {
        return items.map(item => {
          const processedItem = {
            ...item,
            items: item.items ? processOutline(item.items) : undefined
          };
          return processedItem;
        });
      };

      const processedOutline = processOutline(outline || []);
      setOutline(processedOutline);
    } catch (error) {
      console.warn('Could not get outline:', error);
      setOutline([]);
    }
  }, []);

  // EPUB selected text handler
  const handleEpubSelectedText = useCallback((text: string, context?: string) => {
    if (isTranslatingRef.current) return;
    if (text.trim().length > 0) {
      setSelectedWord(text.trim());
      setSelectedContext(context || '');
    }
  }, []);

  // PDF text select handler
  const handlePdfTextSelect = useCallback(() => {
    if (isTranslatingRef.current) return;

    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedWord(selection.toString().trim());
    }
  }, []);

  // Translation state change handler
  const handleTranslationChange = useCallback((translating: boolean) => {
    isTranslatingRef.current = translating;
  }, []);

  // Navigation handlers
  const handlePrevPage = useCallback(() => {
    console.log('handlePrevPage called, epubViewerRef.current:', epubViewerRef.current);
    if (isEpub && epubViewerRef.current) {
      epubViewerRef.current.prev();
      setCurrentPage(prev => Math.max(1, prev - 1));
    }
  }, [isEpub]);

  const handleNextPage = useCallback(() => {
    console.log('handleNextPage called, epubViewerRef.current:', epubViewerRef.current);
    if (isEpub && epubViewerRef.current) {
      epubViewerRef.current.next();
    } else {
      setCurrentPage(prev => Math.min(numPages, prev + 1));
    }
  }, [isEpub, numPages]);

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

  // Convert file path to URL for PDF
  const pdfUrl = isPdf ? (book.path.startsWith('file://') ? book.path : `file://${book.path}`) : '';
  const epubUrl = isEpub ? book.path : '';

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
            if (isEpub && epubViewerRef.current) {
              try {
                epubViewerRef.current.goTo(dest);
              } catch (err) {
                console.warn('EPUB navigation failed:', err);
              }
            } else if (pdfViewerRef.current) {
              if (typeof pdfViewerRef.current.handleOutlineClick === 'function') {
                pdfViewerRef.current.handleOutlineClick(dest);
              }
            }
          }}
        />

        <main className={styles.pdfMain} id="pdf-viewer">
          {isPdf && (
            <PdfViewer
              ref={pdfViewerRef}
              file={pdfUrl}
              numPages={numPages}
              currentPage={currentPage}
              onLoadSuccess={onDocumentLoadSuccess}
              onTextSelect={handlePdfTextSelect}
              onPageChange={setCurrentPage}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              pdfInstance={pdfInstance}
            />
          )}

          {isEpub && (
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
          )}
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
