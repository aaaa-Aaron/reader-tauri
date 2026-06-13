import { useState, useEffect, useRef, useCallback } from 'react';
import ePub, { Book, Rendition } from 'epubjs';
import { readFile } from '@tauri-apps/plugin-fs';
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

    let eBook: Book | null = null;

    const loadBook = async () => {
      try {
        const fileContents = await readFile(bookPath);
        const arrayBuffer = fileContents.buffer;
        eBook = ePub(arrayBuffer);
        await eBook.ready;
        eBookRef.current = eBook;
        setIsReady(true);
      } catch (err) {
        console.warn('Failed to load EPUB:', err);
      }
    };

    loadBook();

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

  // 窗口 resize 和容器尺寸变化处理
  useEffect(() => {
    if (!isReady || !renditionRef.current || !containerRef.current) return;

    const handleResize = () => {
      // 每次都从 ref 获取最新值，避免闭包问题
      const currentContainer = containerRef.current;
      const currentRendition = renditionRef.current;
      if (currentContainer && currentRendition) {
        currentRendition.resize(currentContainer.clientWidth, currentContainer.clientHeight);
      }
    };

    // 使用 ResizeObserver 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isReady, containerRef]);

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
