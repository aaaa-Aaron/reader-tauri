import React, { useEffect, useRef, useState, useCallback } from 'react';
import ePub from 'epubjs';
import type { Book as EpubBook, Rendition } from 'epubjs';
import styles from './EpubViewer.module.css';

interface EpubViewerProps {
  bookPath: string;
  onTextSelect?: (text: string, context: string) => void;
}

const EpubViewer: React.FC<EpubViewerProps> = ({ bookPath, onTextSelect }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [toc, setToc] = useState<Array<{ label: string; href: string }>>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Load EPUB book
  useEffect(() => {
    const loadBook = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch file as ArrayBuffer using XHR (to avoid CORS issues in Tauri)
        const response = await fetch(bookPath);
        const arrayBuffer = await response.arrayBuffer();

        // Create book
        const book = ePub(arrayBuffer);
        bookRef.current = book;

        // Get table of contents
        const navigation = await book.loaded.navigation;
        const tocItems = navigation.toc.map(item => ({
          label: item.label,
          href: item.href
        }));
        setToc(tocItems);

        // Render book
        if (viewerRef.current) {
          const rendition = book.renderTo(viewerRef.current, {
            width: '100%',
            height: '100%',
            spread: 'none'
          });
          renditionRef.current = rendition;

          // Generate locations for pagination
          await book.ready;
          await book.locations.generate(1600);
          setTotalPages(book.locations.total);

          // Display first page
          await rendition.display();

          // Listen for location changes
          rendition.on('relocated', (location: any) => {
            setCurrentLocation(location.start.cfi);
            const page = book.locations.percentageFromCfi(location.start.cfi);
            setCurrentPage(Math.floor(page * book.locations.total) + 1);
          });

          // Listen for text selection
          rendition.on('selected', (cfiRange: string, contents: any) => {
            const selectedText = contents.window.getSelection().toString().trim();
            if (selectedText && onTextSelect) {
              // Get context - the paragraph containing the selection
              const range = contents.window.getSelection().getRangeAt(0);
              const paragraph = range.commonAncestorContainer.parentElement;
              const context = paragraph?.textContent || selectedText;
              onTextSelect(selectedText, context);
            }
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load EPUB:', err);
        setError('Failed to load EPUB file');
        setIsLoading(false);
      }
    };

    loadBook();

    // Cleanup
    return () => {
      if (renditionRef.current) {
        renditionRef.current.destroy();
      }
      if (bookRef.current) {
        bookRef.current.destroy();
      }
    };
  }, [bookPath, onTextSelect]);

  // Navigation functions
  const goPrev = useCallback(() => {
    renditionRef.current?.prev();
  }, []);

  const goNext = useCallback(() => {
    renditionRef.current?.next();
  }, []);

  const goToTocItem = useCallback((href: string) => {
    renditionRef.current?.display(href);
  }, []);

  if (isLoading) {
    return <div className={styles.loading}>Loading EPUB...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      {/* Sidebar with TOC */}
      <aside className={styles.sidebar}>
        <h3>Contents</h3>
        <nav className={styles.toc}>
          {toc.map((item, index) => (
            <button
              key={index}
              className={styles.tocItem}
              onClick={() => goToTocItem(item.href)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main viewer */}
      <main className={styles.main}>
        <div ref={viewerRef} className={styles.viewer} />
        
        {/* Navigation controls */}
        <div className={styles.controls}>
          <button onClick={goPrev} className={styles.navBtn}>← Previous</button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={goNext} className={styles.navBtn}>Next →</button>
        </div>
      </main>
    </div>
  );
};

export default EpubViewer;
