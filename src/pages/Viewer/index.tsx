import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookService } from '../../services/bookService';
import type { Book } from '../../types/book';
import styles from './Viewer.module.css';

const Viewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className={styles.loading}>Loading book...</div>;
  }

  if (!book) {
    return <div className={styles.error}>Book not found</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/library" className={styles.back}>← Back</Link>
        <h1 className={styles.title}>{book.title}</h1>
        <span className={styles.format}>{book.format.toUpperCase()}</span>
      </header>

      <main className={styles.main}>
        <div className={styles.placeholder}>
          <p>Viewer for {book.format.toUpperCase()} files</p>
          <p>Path: {book.path}</p>
          <p>Coming soon...</p>
        </div>
      </main>
    </div>
  );
};

export default Viewer;
