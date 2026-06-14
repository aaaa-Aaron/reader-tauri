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
  // const [isReady, setIsReady] = useState(false);
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
        // setIsReady(true);
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
      // setIsReady(false);
    };
  }, [bookPath]);

  // 渲染内容 + 目录
  useEffect(() => {
    if (!containerRef.current || !eBookRef.current) return;
    const loadRendition = async () => {

      if (!eBookRef.current || !containerRef.current) {
        return;
      }
      const book = eBookRef.current;
      const container = containerRef.current;

      const rendition = book.renderTo(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        spread: 'none',
        flow: 'paginated',
        allowScriptedContent: true
      });
      await rendition.start();

      renditionRef.current = rendition;
      setOutline(unfoldNavigation(book.navigation?.toc));

      rendition.display().catch(err => {
        console.warn('Display error:', err);
      });
    }


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
  }, [eBookRef, containerRef]);

  // 文本选择 + 点击取消选择事件
  useEffect(() => {
    if (!renditionRef.current || !eBookRef.current || !containerRef.current) return;

    const book = eBookRef.current;
    const rendition = renditionRef.current;

    const handleSelected = async (cfiRange: string) => {
      try {
        const { text, sentence } = await extractSentenceByCfiRange(book, cfiRange);
        onTextSelected?.(text, sentence);
      } catch (err) {
        console.warn('Failed to get selected text:', err);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 点击的是链接或按钮时不处理
      if (target.tagName === 'A' || target.tagName === 'BUTTON') return;

      // event.detail: 1=单击, 2=双击
      if (e.detail === 1) {
        // 单击：关闭翻译弹窗（浏览器本身会清除文本选择）
        onTextSelected?.('', '');
      }
    };

    rendition.on('selected', handleSelected);
    rendition.on('click', handleClick);

    return () => {
      rendition.off('selected', handleSelected);
      rendition.off('click', handleClick);
    };
  }, [onTextSelected, containerRef]);

  // 窗口 resize 和容器尺寸变化处理
  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = () => {
      // 每次都从 ref 获取最新值，避免闭包问题
      const currentContainer = containerRef.current;
      const currentRendition = renditionRef.current;
      // 确保 rendition 存在且有 resize 方法
      if (currentContainer && currentRendition && typeof currentRendition.resize === 'function') {
        currentRendition.resize(currentContainer.clientWidth, currentContainer.clientHeight);
      }
    };

    // 使用 ResizeObserver 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  const prev = useCallback(() => {
    renditionRef.current?.prev();
  }, []);

  const next = useCallback(() => {
    renditionRef.current?.next();
  }, []);

  const goTo = useCallback((dest: string) => {
    renditionRef.current?.display(dest);
  }, []);

  return { outline, prev, next, goTo };
}
