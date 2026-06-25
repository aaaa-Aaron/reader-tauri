import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ePub, { Rendition } from 'epubjs';
import { readFile } from '@tauri-apps/plugin-fs';
import styles from './AnnotationTest.module.css';

interface Bookmark {
  id: number;
  cfi: string;
  content: string;
}

export default function AnnotationTest() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [selectedCfi, setSelectedCfi] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [nextBookmarkId, setNextBookmarkId] = useState(1);
  const [noteContent, setNoteContent] = useState('');
  const [selectedNote, setSelectedNote] = useState<Bookmark | null>(null);

  // 加载书籍
  useEffect(() => {
    const bookPath = 'C:\\Users\\Aaron\\Downloads\\The Absorbent Mind (Montessori Maria) (Z-Library).epub';
    const loadBook = async () => {
      if (!containerRef.current) return;

      const fileContents = await readFile(bookPath);
      const book = ePub(fileContents.buffer);
      await book.ready;

      const rendition = book.renderTo(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        spread: 'none',
      });

      renditionRef.current = rendition;

      // 监听文本选中事件
      rendition.on('selected', (cfiRange: string) => {
        setSelectedCfi(cfiRange);
      });

      await rendition.display();
    };

    loadBook();
  }, []);

  // 添加高亮注解
  const addHighlight = () => {
    if (!renditionRef.current || !selectedCfi) return;

    const id = nextBookmarkId;
    setNextBookmarkId(prev => prev + 1);
    const markerId = `bookmark-${id}`;

    renditionRef.current.annotations.highlight(
      selectedCfi,
      { bookmarkId: id, content: noteContent },
      () => showNote(id),
      markerId,
      { fill: '#6cef00ff', 'fill-opacity': '0.3' }
    );

    setBookmarks(prev => [...prev, { id, cfi: selectedCfi, content: noteContent }]);
    setSelectedCfi('');
  };

  // 添加下划线注解
  const addUnderline = () => {
    if (!renditionRef.current || !selectedCfi) return;

    const id = nextBookmarkId;
    setNextBookmarkId(prev => prev + 1);
    const markerId = `bookmark-${id}`;

    renditionRef.current.annotations.underline(
      selectedCfi,
      { bookmarkId: id, content: noteContent },
      () => showNote(id),
      markerId,
      { stroke: '#1890ff', 'stroke-opacity': '1', 'stroke-width': '2' }
    );

    setBookmarks(prev => [...prev, { id, cfi: selectedCfi, content: noteContent }]);
    setSelectedCfi('');
  };

  // 通用添加注解方法
  const addAnnotation = (type: 'highlight' | 'underline') => {
    if (!renditionRef.current || !selectedCfi) return;

    const id = nextBookmarkId;
    setNextBookmarkId(prev => prev + 1);
    const markerId = `bookmark-${id}`;

    renditionRef.current.annotations.add(
      type,
      selectedCfi,
      { bookmarkId: id, content: noteContent },
      () => showNote(id),
      markerId,
      type === 'highlight'
        ? { fill: '#6cef00ff', 'fill-opacity': '0.3' }
        : { stroke: '#1890ff', 'stroke-opacity': '1', 'stroke-width': '2' }
    );

    setBookmarks(prev => [...prev, { id, cfi: selectedCfi, content: noteContent }]);
    setSelectedCfi('');
  };

  // 删除注解
  const removeAnnotation = (id: number) => {
    if (!renditionRef.current) return;

    const bookmark = bookmarks.find(b => b.id === id);
    if (!bookmark) return;

    renditionRef.current.annotations.remove(bookmark.cfi, 'highlight');
    renditionRef.current.annotations.remove(bookmark.cfi, 'underline');
    setBookmarks(prev => prev.filter(b => b.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
  };

  // 显示注解内容
  const showNote = (id: number) => {
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) setSelectedNote(bookmark);
  };

  // 翻页
  const goPrev = () => renditionRef.current?.prev();
  const goNext = () => renditionRef.current?.next();

  return (
    <div className={styles.annotationTest}>
      <div className={styles.controls}>
        <h1>Epub.js Annotation 示例</h1>

        <div className={styles.controlGroup}>
          <button onClick={() => navigate('/library')}>返回主页</button>
        </div>

        <div className={styles.controlGroup}>
          <button onClick={goPrev}>上一页</button>
          <button onClick={goNext}>下一页</button>
        </div>

        <div className={styles.controlGroup}>
          <label>注解内容:</label>
          <textarea
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            placeholder="输入书签内容..."
            className={styles.noteInput}
          />
        </div>

        <div className={styles.controlGroup}>
          <button onClick={addHighlight} disabled={!selectedCfi}>添加高亮</button>
          <button onClick={addUnderline} disabled={!selectedCfi}>添加下划线</button>
          <button onClick={() => addAnnotation('highlight')} disabled={!selectedCfi}>add('highlight')</button>
          <button onClick={() => addAnnotation('underline')} disabled={!selectedCfi}>add('underline')</button>
        </div>

        {selectedNote && (
          <div className={styles.selectedNote}>
            <h3>注解内容</h3>
            <p>{selectedNote.content}</p>
            <button onClick={() => setSelectedNote(null)}>关闭</button>
          </div>
        )}

        <div className={styles.bookmarksList}>
          <h3>当前注解 ({bookmarks.length})</h3>
          <ul>
            {bookmarks.map(b => (
              <li key={b.id}>
                {b.content || '(无)'}
                <button onClick={() => removeAnnotation(b.id)}>删除</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.viewerContainer} ref={containerRef} />
    </div>
  );
}
