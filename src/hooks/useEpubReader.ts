import { useState, useEffect, useRef, useCallback } from 'react';
import ePub, { Book, Rendition } from 'epubjs';
import { convertFileSrc } from '@tauri-apps/api/core';
import { extractSentenceByCfiRange, unfoldNavigation } from '../utils/epubUtils';

interface UseEpubReaderOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  bookPath: string | null;
  onTextSelected?: (word: string, context: string) => void;
}

interface UseEpubReaderReturn {
  isReady: boolean;
  outline: any[];
  prev: () => void;
  next: () => void;
  goTo: (dest: string) => void;
}

export function useEpubReader({
  containerRef,
  bookPath,
  onTextSelected
}: UseEpubReaderOptions): UseEpubReaderReturn {
  const eBookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [outline, setOutline] = useState<any[]>([]);

  // 创建 EPUB Book 实例
  useEffect(() => {
    if (!bookPath) return;

    const eBook = ePub(convertFileSrc(bookPath));
    eBook.ready
      .then(() => {
        eBookRef.current = eBook;
        setIsReady(true);
      })
      .catch(err => {
        console.warn('Failed to load EPUB:', err);
      });

    return () => {
      if (eBookRef.current) {
        eBookRef.current.destroy();
        eBookRef.current = null;
      }
      setIsReady(false);
    };
  }, [bookPath]);

  // 渲染内容 + 目录
  useEffect(() => {
    if (!isReady || !containerRef.current || !eBookRef.current) return;

    const book = eBookRef.current;
    const container = containerRef.current;

    const rendition = book.renderTo(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      spread: 'none',
      flow: 'paginated',
      allowScriptedContent: true
    });

    renditionRef.current = rendition;
    setOutline(unfoldNavigation(book.navigation?.toc));

    rendition.display().catch(err => {
      console.warn('Display error:', err);
    });

    return () => {
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy();
        } catch (err) {
          console.warn('Failed to destroy rendition:', err);
        }
        renditionRef.current = null;
      }
      setOutline([]);
    };
  }, [isReady, containerRef]);

  // 文本选择 + 点击取消选择事件
  useEffect(() => {
    if (!renditionRef.current || !eBookRef.current || !containerRef.current) return;

    const book = eBookRef.current;
    const rendition = renditionRef.current;
    const container = containerRef.current;

    const handleSelected = async (cfiRange: string) => {
      try {
        const { text, sentence } = await extractSentenceByCfiRange(book, cfiRange);
        onTextSelected?.(text, sentence);
      } catch (err) {
        console.warn('Failed to get selected text:', err);
      }
    };

    const handleClick = () => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        onTextSelected?.('', '');
      }
    };

    rendition.on('selected', handleSelected);
    container.addEventListener('click', handleClick);

    return () => {
      rendition.off('selected', handleSelected);
      container.removeEventListener('click', handleClick);
    };
  }, [isReady, onTextSelected, containerRef]);

  const prev = useCallback(() => {
    renditionRef.current?.prev();
  }, []);

  const next = useCallback(() => {
    renditionRef.current?.next();
  }, []);

  const goTo = useCallback((dest: string) => {
    renditionRef.current?.display(dest);
  }, []);

  return { isReady, outline, prev, next, goTo };
}
