import { useState, useEffect, useRef, useCallback } from 'react';
import ePub, { Book, Rendition } from 'epubjs';
import { readFile } from '@tauri-apps/plugin-fs';
import { extractSentenceByCfiRange, unfoldNavigation } from '../../../shared/utils/epubUtils';

interface UseEpubReaderOptions {
    containerRef: React.RefObject<HTMLDivElement | null>;
    bookPath: string | null;
    onTextSelected?: (word: string, context: string, cfiRange?: string) => void;
    onAnnotationClick?: (cfi: string, annotationId: number) => void;
}

interface UseEpubReaderReturn {
    outline: any[];
    prev: () => void;
    next: () => void;
    goTo: (dest: string) => void;
    addAnnotationMarker: (cfi: string, id: number) => void;
    removeAnnotationMarker: (cfi: string) => void;
}

export function useEpubReader({
    containerRef,
    bookPath,
    onTextSelected,
    onAnnotationClick
}: UseEpubReaderOptions): UseEpubReaderReturn {
    const eBookRef = useRef<Book | null>(null);
    const renditionRef = useRef<Rendition | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isDisplayed, setIsDisplayed] = useState(false);
    const [outline, setOutline] = useState<any[]>([]);

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

            renditionRef.current = rendition;
            setOutline(unfoldNavigation(book.navigation?.toc));

            await rendition.display();
            setIsDisplayed(true);
        }
        loadRendition();

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

    // ResizeObserver: 容器尺寸变化时自动调整 rendition
    useEffect(() => {
        if (!isDisplayed || !renditionRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const rendition = renditionRef.current;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    try {
                        rendition.resize(width, height);
                    } catch (err) {
                        console.warn('Failed to resize rendition:', err);
                    }
                }
            }
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [isDisplayed, containerRef]);

    useEffect(() => {
        if (!isDisplayed || !renditionRef.current || !eBookRef.current) return;

        const book = eBookRef.current;
        const rendition = renditionRef.current;

        const handleSelected = async (cfiRange: string) => {
            try {
                const { text, sentence } = await extractSentenceByCfiRange(book, cfiRange);
                onTextSelected?.(text, sentence, cfiRange);
            } catch (err) {
                console.warn('Failed to get selected text:', err);
            }
        };

        rendition.on('selected', handleSelected);

        return () => {
            rendition.off('selected', handleSelected);
        };
    }, [isDisplayed, onTextSelected]);

    const addAnnotationMarker = useCallback((cfi: string, id: number) => {
        if (!renditionRef.current) {
            console.warn('addAnnotationMarker: renditionRef.current is null');
            return;
        }

        try {
            const markerId = `annotation-${id}`;
            const data = { annotationId: id };

            renditionRef.current.annotations.underline(
                cfi,
                data,
                () => {
                    onAnnotationClick?.(cfi, id);
                },
                markerId,
                {
                    stroke: '#1890ff',
                    'stroke-opacity': '1',
                    'stroke-width': '2'
                }
            );

            console.log('Added annotation marker:', id, cfi);
        } catch (err) {
            console.warn('Failed to add annotation marker:', err);
        }
    }, [onAnnotationClick]);

    const removeAnnotationMarker = useCallback((cfi: string) => {
        if (!renditionRef.current) return;

        try {
            renditionRef.current.annotations.remove(cfi, 'underline');
            console.log('Removed annotation marker:', cfi);
        } catch (err) {
            console.warn('Failed to remove annotation marker:', err);
        }
    }, []);

    const prev = useCallback(() => {
        if (renditionRef.current) {
            renditionRef.current.prev();
        }
    }, []);

    const next = useCallback(() => {
        if (renditionRef.current) {
            renditionRef.current.next();
        }
    }, []);

    const goTo = useCallback((dest: string) => {
        if (renditionRef.current) {
            renditionRef.current.display(dest);
        }
    }, []);

    return {
        outline,
        prev,
        next,
        goTo,
        addAnnotationMarker,
        removeAnnotationMarker
    };
}