import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import styles from './PdfViewer.module.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  bookPath: string;
  onTextSelect?: (text: string, context: string) => void;
}

interface OutlineItem {
  title: string;
  dest: any;
  items?: OutlineItem[];
}

const PdfViewer: React.FC<PdfViewerProps> = ({ bookPath, onTextSelect }) => {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfInstance, setPdfInstance] = useState<any>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [containerWidth, setContainerWidth] = useState(800);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // PDF options
  const options = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  }), []);

  // Resize observer for responsive width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width - 40);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Handle PDF load success
  const onDocumentLoadSuccess = useCallback(async ({ numPages, pdf }: any) => {
    setNumPages(numPages);
    setPdfInstance(pdf);

    // Get outline (table of contents)
    try {
      const outlineData = await pdf.getOutline();
      if (outlineData) {
        const processedOutline = outlineData.map((item: any) => ({
          title: item.title,
          dest: item.dest,
          items: item.items?.map((subItem: any) => ({
            title: subItem.title,
            dest: subItem.dest,
          })),
        }));
        setOutline(processedOutline);
      }
    } catch (err) {
      console.warn('Failed to get outline:', err);
    }
  }, []);

  // Handle PDF load error
  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('Failed to load PDF:', err);
    setError('Failed to load PDF file');
  }, []);

  // Navigate to page from outline
  const goToDestination = useCallback(async (dest: any) => {
    if (!pdfInstance || !dest) return;

    try {
      const destination = typeof dest === 'string'
        ? await pdfInstance.getDestination(dest)
        : dest;

      if (destination) {
        const pageRef = destination[0];
        const pageIndex = await pdfInstance.getPageIndex(pageRef);
        const pageNumber = pageIndex + 1;
        setCurrentPage(Math.max(1, Math.min(pageNumber, numPages)));
      }
    } catch (err) {
      console.warn('Failed to resolve destination:', err);
    }
  }, [pdfInstance, numPages]);

  // Navigation functions
  const goPrev = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentPage(prev => Math.min(numPages, prev + 1));
  }, []);

  // Handle text selection
  const handleTextSelect = useCallback(() => {
    if (!onTextSelect) return;

    const selection = window.getSelection();
    if (!selection) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Get context from the selection range
    const range = selection.getRangeAt(0);
    let context = selectedText;

    // Try to get surrounding text for context
    try {
      const container = range.commonAncestorContainer;
      const parentElement = container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container as Element;

      if (parentElement) {
        const fullText = parentElement.textContent || '';
        const startOffset = Math.max(0, fullText.indexOf(selectedText) - 50);
        const endOffset = Math.min(fullText.length, fullText.indexOf(selectedText) + selectedText.length + 50);
        context = fullText.slice(startOffset, endOffset);
      }
    } catch {
      context = selectedText;
    }

    onTextSelect(selectedText, context);
  }, [onTextSelect]);

  // Convert file path to URL for react-pdf
  const fileUrl = useMemo(() => {
    // For Tauri, we need to use the file:// protocol
    if (bookPath.startsWith('file://')) {
      return bookPath;
    }
    return `file://${bookPath}`;
  }, [bookPath]);

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      {/* Sidebar with outline */}
      {outline.length > 0 && (
        <aside className={styles.sidebar}>
          <h3>Contents</h3>
          <nav className={styles.outline}>
            {outline.map((item, index) => (
              <div key={index}>
                <button
                  className={styles.outlineItem}
                  onClick={() => goToDestination(item.dest)}
                >
                  {item.title}
                </button>
                {item.items?.map((subItem, subIndex) => (
                  <button
                    key={`${index}-${subIndex}`}
                    className={styles.outlineSubItem}
                    onClick={() => goToDestination(subItem.dest)}
                  >
                    {subItem.title}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>
      )}

      {/* Main viewer */}
      <main className={styles.main}>
        <div
          ref={containerRef}
          className={styles.viewer}
          onMouseUp={handleTextSelect}
        >
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div className={styles.loading}>Loading PDF...</div>}
            options={options}
          >
            <Page
              pageNumber={currentPage}
              width={containerWidth}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              canvasBackground="#ffffff"
            />
          </Document>
        </div>

        {/* Navigation controls */}
        <div className={styles.controls}>
          <button
            onClick={goPrev}
            disabled={currentPage <= 1}
            className={styles.navBtn}
          >
            ← Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={goNext}
            disabled={currentPage >= numPages}
            className={styles.navBtn}
          >
            Next →
          </button>
        </div>
      </main>
    </div>
  );
};

export default PdfViewer;