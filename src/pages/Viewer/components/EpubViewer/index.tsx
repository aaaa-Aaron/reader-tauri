import { useState, useEffect, useRef, useImperativeHandle, Ref } from 'react';
import ePub, { Book, Rendition } from 'epubjs';
import { readFile } from '@tauri-apps/plugin-fs';
import styles from '../../Viewer.module.css';

export interface EpubViewerRef {
  prev: () => void;
  next: () => void;
  getOutline: () => Promise<any[]>;
  goTo: (href: string) => void;
}

interface EpubViewerProps {
  ref: Ref<EpubViewerRef | null>;
  file: string;
  onSelectedText: (text: string, context?: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onLoadSuccess?: (book: Book) => void;
  onPageChange?: (currentPage: number, totalPages: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onGoTo?: (href: string) => void;
}

const EpubViewer: React.FC<EpubViewerProps> = ({
  ref,
  file,
  onSelectedText,
  onPrevPage,
  onNextPage,
  onLoadSuccess,
  onPageChange,
  onPrev,
  onNext,
  onGoTo
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookRef = useRef<Book | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const isInitializingRef = useRef(false);

  const onPageChangeRef = useRef(onPageChange);
  const onLoadSuccessRef = useRef(onLoadSuccess);
  const onSelectedTextRef = useRef(onSelectedText);
  const onPrevRef = useRef(onPrev);
  const onNextRef = useRef(onNext);
  const onGoToRef = useRef(onGoTo);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
    onLoadSuccessRef.current = onLoadSuccess;
    onSelectedTextRef.current = onSelectedText;
    onPrevRef.current = onPrev;
    onNextRef.current = onNext;
    onGoToRef.current = onGoTo;
  });

  useImperativeHandle(ref, () => ({
    prev: async () => {
      if (renditionRef.current) {
        try {
          const currentLoc = renditionRef.current.currentLocation();
          console.log('Current location before prev:', currentLoc);
          const result = renditionRef.current.prev();
          console.log('prev() returned:', result);
          if (result instanceof Promise) {
            await result.then(() => {
              console.log('prev() resolved');
              const newLoc = renditionRef.current?.currentLocation();
              console.log('Current location after prev:', newLoc);
            }).catch(err => console.error('prev() promise rejected:', err));
          }
        } catch (err) {
          console.warn('Failed to navigate prev:', err);
        }
      }
    },
    next: async () => {
      console.log('useImperativeHandle next called, renditionRef.current:', renditionRef.current);
      if (renditionRef.current) {
        try {
          const currentLoc = renditionRef.current.currentLocation();
          console.log('Current location before next:', currentLoc);
          const result = renditionRef.current.next();
          console.log('next() returned:', result);
          if (result instanceof Promise) {
            await result.then(() => {
              console.log('next() resolved');
              const newLoc = renditionRef.current?.currentLocation();
              console.log('Current location after next:', newLoc);
            }).catch(err => console.error('next() promise rejected:', err));
          }
        } catch (err) {
          console.warn('Failed to navigate next:', err);
        }
      }
    },

    getOutline: async () => {
      if (!bookRef.current) return [];
      try {
        await bookRef.current.ready;
        const nav = bookRef.current.navigation;
        if (nav && nav.toc) {
          return nav.toc;
        }
        return [];
      } catch (err) {
        console.warn('Failed to get outline:', err);
        return [];
      }
    },

    goTo: async (href: string) => {
      if (renditionRef.current) {
        try {
          renditionRef.current.display(href);
        } catch (err) {
          console.warn('Failed to navigate to:', href, err);
        }
      }
    }
  }))


  // ResizeObserver for dimension changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Load EPUB book
  useEffect(() => {
    if (!file || !containerRef.current || isInitializingRef.current || renditionRef.current) return;

    isInitializingRef.current = true;

    const loadBook = async () => {
      try {
        // Read file using Tauri FS API
        const uint8Array = await readFile(file);
        const arrayBuffer = uint8Array.buffer.slice(
          uint8Array.byteOffset,
          uint8Array.byteOffset + uint8Array.byteLength
        );

        const book = ePub(arrayBuffer);
        bookRef.current = book;

        await book.ready;

        if (!containerRef.current) {
          return;
        }

        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const rendition = book.renderTo(containerRef.current, {
          width: containerWidth,
          height: containerHeight,
          spread: 'none' as const,
          flow: 'paginated' as const,
          allowScriptedContent: true
        });

        renditionRef.current = rendition;
        console.log('Rendition created and set:', rendition);

        try {
          await rendition.display();
        } catch (err) {
          console.warn('Display error:', err);
        }

        try {
          // 生成虚拟页码
          await book.locations.generate(1024);
        } catch (err) {
          console.warn('Failed to generate locations:', err);
        }

        const total = book.locations.length();

        rendition.on('relocated', (_location: any) => {
          if (!renditionRef.current) return;

          try {
            const currentLoc = renditionRef.current.currentLocation();
            if (currentLoc && typeof currentLoc.index === 'number') {
              const pageNum = currentLoc.index + 1;
              onPageChangeRef.current?.(pageNum, total);
            }
          } catch (err) {
            console.warn('Failed to get current location:', err);
          }
        });

        rendition.on('selected', async (cfiRange: string, _contents: any) => {
          try {
            const range = await book.getRange(cfiRange);
            const text = range.toString().trim();
            if (!text) return;

            let context = '';

            if (range && range.commonAncestorContainer) {
              const container = range.commonAncestorContainer;
              let paragraphText = '';
              if (container.nodeType === Node.TEXT_NODE && container.textContent) {
                paragraphText = container.textContent;
              } else if ('textContent' in container) {
                paragraphText = (container as Text).textContent || '';
              }

              if (paragraphText) {
                const startOffset = range.startOffset;
                const sentencePattern = /[^.!?。！？\n]+[.!?。！？]+/g;
                const sentences = paragraphText.match(sentencePattern) || [paragraphText];

                let containingSentence = '';
                let accumulatedLength = 0;

                for (const sentence of sentences) {
                  const sentenceStart = accumulatedLength;
                  const sentenceEnd = accumulatedLength + sentence.length;

                  if (startOffset >= sentenceStart && startOffset < sentenceEnd) {
                    containingSentence = sentence.trim();
                    break;
                  }
                  accumulatedLength += sentence.length;
                }

                if (!containingSentence && sentences.length === 1) {
                  containingSentence = sentences[0].trim();
                }

                if (containingSentence) {
                  context = containingSentence;
                } else {
                  const selectedLower = text.toLowerCase();
                  const paragraphLower = paragraphText.toLowerCase();
                  const matchIndex = paragraphLower.indexOf(selectedLower);

                  if (matchIndex >= 0) {
                    accumulatedLength = 0;
                    for (const sentence of sentences) {
                      const sentenceStart = accumulatedLength;
                      const sentenceEnd = accumulatedLength + sentence.length;

                      if (matchIndex >= sentenceStart && matchIndex < sentenceEnd) {
                        containingSentence = sentence.trim();
                        break;
                      }
                      accumulatedLength += sentence.length;
                    }
                    if (containingSentence) {
                      context = containingSentence;
                    }
                  }
                }
              }

              if (!context || context.length < text.length) {
                context = text;
              }

              if (context.length > 300) {
                const textIndex = context.toLowerCase().indexOf(text.toLowerCase());
                if (textIndex >= 0) {
                  const contextStart = Math.max(0, textIndex - 100);
                  const contextEnd = Math.min(context.length, textIndex + text.length + 100);
                  context = (contextStart > 0 ? '...' : '') +
                    context.substring(contextStart, contextEnd).trim() +
                    (contextEnd < context.length ? '...' : '');
                }
              }

              onSelectedTextRef.current?.(text, context);
            }
          } catch (err) {
            console.warn('Failed to get selected text:', err);
          }
        });

        try {
          const initialLoc = rendition.currentLocation();
          const initialPage = initialLoc && typeof initialLoc.index === 'number' ? initialLoc.index + 1 : 1;
          onPageChangeRef.current?.(initialPage, total);
          onLoadSuccessRef.current?.(book);
        } catch (err) {
          console.warn('Failed to get initial location:', err);
          onLoadSuccessRef.current?.(book);
        }

      } catch (err) {
        console.error('EPUB loading error:', err);
      }
    };

    if (!renditionRef.current) {
      loadBook();
    }

    return () => {
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy();
        } catch (err) {
          console.warn('Failed to destroy rendition:', err);
        }
        renditionRef.current = null;
        isInitializingRef.current = false;
      }
      if (bookRef.current) {
        try {
          bookRef.current.destroy();
        } catch (err) {
          console.warn('Failed to destroy book:', err);
        }
        bookRef.current = null;
      }
    };
  }, [file]);

  // Handle dimension changes - resize rendition
  useEffect(() => {
    if (renditionRef.current && dimensions.width > 0 && dimensions.height > 0) {
      try {
        renditionRef.current.resize(dimensions.width, dimensions.height);
      } catch (err) {
        console.warn('Failed to resize:', err);
      }
    }
  }, [dimensions]);

  const handlePrevClick = () => {
    console.log('handlePrevClick called, renditionRef.current:', renditionRef.current);
    onPrevPage();
  };

  const handleNextClick = () => {
    console.log('handleNextClick called, renditionRef.current:', renditionRef.current);
    onNextPage();
  };

  return (
    <div
      ref={containerRef}
      className={styles.epubContainer}
    >
      <div className={styles.pageNavigation}>
        <button
          className={styles.navBtn}
          onClick={handlePrevClick}
        >
          ‹
        </button>
        <button
          className={styles.navBtn}
          onClick={handleNextClick}
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default EpubViewer;