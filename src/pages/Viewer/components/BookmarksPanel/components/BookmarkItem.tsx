import React from 'react';
import styles from '../BookmarksPanel.module.css';
import type { Bookmark } from '../types';
import { UserAvatar } from './UserAvatar';

interface BookmarkItemProps {
  bookmark: Bookmark;
}

export const BookmarkItem: React.FC<BookmarkItemProps> = ({ bookmark }) => (
  <div className={styles.bookmarkItem}>
    <div className={styles.bookmarkHeader}>
      <UserAvatar user={bookmark.user} />
      <span className={styles.time}>{bookmark.createdAt}</span>
    </div>
    <div className={styles.bookmarkPosition}>{bookmark.position}</div>
    <div className={styles.bookmarkContent}>{bookmark.content}</div>
    <div className={styles.bookmarkActions}>
      <button className={styles.actionBtn}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      </button>
      <button className={styles.actionBtn}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 14.66V17c0 .55-.47.98-.97 1.21l-3.96 2.13a1 1 0 0 1-1.07 0l-3.96-2.13A.99.99 0 0 1 4 17v-2.34l8-4.66 8 4.66z" />
        </svg>
      </button>
    </div>
  </div>
);
