import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookService } from '../../services/bookService';
import { translationService } from '../../services/translationService';
import type { Book } from '../../types/book';
import type { TranslationRequest } from '../../types/translation';
import EpubViewer from './components/EpubViewer';
import PdfViewer from './components/PdfViewer';
import styles from './Viewer.module.css';

const Viewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (id) {
      loadBook(parseInt(id));
    }
  }, [id]);

  const loadBook = async (bookId: number) => {
    try {
      setLoading(true);
      const data = await bookService.getBookById(bookId);
      setBook(data);
    } catch (error) {
      console.error('Failed to load book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSelect = useCallback(async (text: string, context: string) => {
    setSelectedText(text);
    setTranslating(true);
    setTranslation(null);

    try {
      const request: TranslationRequest = {
        text,
        from: 'auto',
        to: 'zh-CHS',
        bookId: book?.id,
        context
      };

      const result = await translationService.translate(request);
      
      if (result.success && result.apiResult) {
        setTranslation(result.apiResult.translated);
      } else {
        setTranslation('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslation('Translation error');
    } finally {
      setTranslating(false);
    }
  }, [book?.id]);

  // Close translation panel
  const closeTranslationPanel = useCallback(() => {
    setSelectedText('');
    setTranslation(null);
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading book...</div>;
  }

  if (!book) {
    return <div className={styles.error}>Book not found</div>;
  }

  // Convert file path to URL
  const bookUrl = book.path;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/library" className={styles.back}>← Back</Link>
        <h1 className={styles.title}>{book.title}</h1>
        <span className={styles.format}>{book.format.toUpperCase()}</span>
      </header>

      <main className={styles.main}>
        {book.format === 'epub' ? (
          <EpubViewer 
            bookPath={bookUrl} 
            onTextSelect={handleTextSelect}
          />
        ) : book.format === 'pdf' ? (
          <PdfViewer 
            bookPath={bookUrl}
            onTextSelect={handleTextSelect}
          />
        ) : (
          <div className={styles.placeholder}>
            <p>Unsupported format: {book.format}</p>
          </div>
        )}

        {/* Translation Panel */}
        {(selectedText || translating) && (
          <aside className={styles.translationPanel}>
            <button 
              className={styles.closeBtn}
              onClick={closeTranslationPanel}
            >
              ×
            </button>
            <h3>Translation</h3>
            <div className={styles.originalText}>{selectedText}</div>
            {translating ? (
              <div className={styles.translating}>Translating...</div>
            ) : (
              <div className={styles.translatedText}>{translation}</div>
            )}
          </aside>
        )}
      </main>
    </div>
  );
};

export default Viewer;