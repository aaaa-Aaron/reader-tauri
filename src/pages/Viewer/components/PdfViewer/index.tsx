import { useState, useMemo, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import styles from '../../Viewer.module.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  file: string;
  numPages: number;
  currentPage: number;
  onLoadSuccess: (pdf: any) => void;
  onTextSelect: () => void;
  onPageChange: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  pdfInstance: any;
}

export interface PdfViewerRef {
  goToDestination: (dest: any) => void;
  handleOutlineClick: (dest: any) => void;
}

const PdfViewer = forwardRef<PdfViewerRef, PdfViewerProps>(({
  file,
  numPages,
  currentPage,
  onLoadSuccess,
  onTextSelect,
  onPageChange,
  onPrevPage,
  onNextPage,
  pdfInstance,
}, ref) => {
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@2.11.338/cmaps/',
    cMapPacked: true,
  }), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const resolveDestToPage = async (dest: any): Promise<number> => {
    const destination = typeof dest === 'string'
      ? await pdfInstance.getDestination(dest)
      : dest;

    const pageRef = destination[0];
    const pageIndex = await pdfInstance.getPageIndex(pageRef);
    return pageIndex + 1;
  };

  const goToDestination = async (dest: any) => {
    if (dest && pdfInstance) {
      try {
        const pageNumber = await resolveDestToPage(dest);
        const validPageNumber = Math.max(1, Math.min(pageNumber, numPages));
        onPageChange(validPageNumber);
      } catch (error) {
        console.error('解析目录目标失败:', error);
        onPageChange(1);
      }
    }
  };

  const handleOutlineClick = async (dest: any) => {
    await goToDestination(dest);
  };

  useImperativeHandle(ref, () => ({
    goToDestination,
    handleOutlineClick
  }));

  return (
    <div
      ref={containerRef}
      className={styles.pdfPageContainer}
      onMouseUp={pagesLoaded ? onTextSelect : undefined}
    >
      <Document
        file={file}
        onLoadSuccess={onLoadSuccess}
        loading={<div className={styles.loadingIndicator}>Loading PDF...</div>}
        error={<div>Failed to load PDF</div>}
        options={options}
      >
        <Page
          pageNumber={currentPage}
          width={containerWidth}
          renderTextLayer={true}
          renderAnnotationLayer={false}
          canvasBackground="#ffffff"
          error={<div className={styles.pageError}>Failed to load page {currentPage}</div>}
          onLoadSuccess={() => setPagesLoaded(true)}
          onLoadError={(error) => {
            console.warn(`Failed to load page ${currentPage}:`, error);
          }}
        />
      </Document>

      <div className={styles.pageNavigation}>
        <button
          className={styles.navBtn}
          onClick={onPrevPage}
          disabled={currentPage <= 1}
        >
          ‹
        </button>
        <button
          className={styles.navBtn}
          onClick={onNextPage}
          disabled={currentPage >= numPages}
        >
          ›
        </button>
      </div>
    </div>
  );
});

export default PdfViewer;
