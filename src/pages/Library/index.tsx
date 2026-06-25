import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookService } from '../../entities/book';
import type { IBook } from '../../entities/book';
import { fileService } from '../../shared/utils/fileService';
import styles from './Library.module.css';

const Library: React.FC = () => {
  const [books, setBooks] = useState<IBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await bookService.getAllBooks();
      setBooks(data);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      const filePath = await fileService.selectFile();
      if (!filePath) return;

      setUploading(true);

      // Extract file info
      const fileName = filePath.split(/[/\\]/).pop() || '';
      const ext = fileName.split('.').pop()?.toLowerCase();

      if (ext !== 'pdf' && ext !== 'epub') {
        alert('Only PDF and EPUB files are supported');
        return;
      }

      // Get file size
      const fileSize = await fileService.getFileSize(filePath);

      // Copy file to app data
      const destPath = await fileService.copyToAppData(filePath, fileName);

      // Create book record
      const newBook = await bookService.createBook({
        title: fileName.replace(/\.[^/.]+$/, ''),
        format: ext as 'pdf' | 'epub',
        filePath: destPath,
        fileSize: fileSize
      });

      setBooks(prev => [...prev, newBook]);
    } catch (error) {
      console.error('Failed to upload book:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>My Library</h1>
        <div className={styles.controls}>
          <Link to="/statistics" className={styles.link}>Statistics</Link>
          <Link to="/annotation-test" className={styles.link}>Annotation Test</Link>
          <button
            className={styles.uploadBtn}
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Book'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {books.length === 0 ? (
          <div className={styles.empty}>
            <p>No books yet</p>
            <p>Upload your first book to get started</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {books.map(book => (
              <Link
                key={book.id}
                to={`/viewer/${book.id}`}
                className={styles.card}
              >
                <div className={styles.icon}>
                  {book.format === 'pdf' || book.fileType === 'pdf' ? '📄' : '📖'}
                </div>
                <h3 className={styles.title}>{book.title}</h3>
                <p className={styles.meta}>{(book.format || book.fileType || '').toUpperCase()}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Library;
