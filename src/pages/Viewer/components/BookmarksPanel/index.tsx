import React, { useState } from 'react';
import { Input } from 'antd';
import styles from './BookmarksPanel.module.css';
import type { Bookmark, Comment, TabType } from './types';
import { mockBookmarks, mockComments } from './data/mockData';
import { BookmarkItem } from './components/BookmarkItem';
import { CommentItem } from './components/CommentItem';

const { TextArea } = Input;

interface BookmarksPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const BookmarksPanel: React.FC<BookmarksPanelProps> = ({ isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('bookmarks');
  const [newComment, setNewComment] = useState('');
  const [bookmarks] = useState<Bookmark[]>(mockBookmarks);
  const [comments] = useState<Comment[]>(mockComments);

  if (!isVisible) return null;

  return (
    <aside className={styles.sidebar}>
      {/* 头部标签切换 */}
      <header className={styles.header}>
        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'bookmarks' ? styles.active : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 3h5v5" />
              <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v13z" />
              <path d="M14 2H6a2 2 0 0 0-2 2v3" />
            </svg>
            书签 ({bookmarks.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            评论 ({comments.length})
          </button>
        </nav>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </header>

      {/* 内容区域 */}
      <main className={styles.content}>
        {activeTab === 'bookmarks' ? (
          <div className={styles.bookmarkList}>
            {bookmarks.map((bookmark) => (
              <BookmarkItem key={bookmark.id} bookmark={bookmark} />
            ))}
            <button className={styles.addBookmarkBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              添加书签
            </button>
          </div>
        ) : (
          <div className={styles.commentList}>
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </main>

      {/* 评论输入框 */}
      {activeTab === 'comments' && (
        <footer className={styles.inputArea}>
          <TextArea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="添加评论..."
            autoSize={{ minRows: 1, maxRows: 3 }}
            className={styles.input}
          />
          <button className={styles.sendBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </footer>
      )}
    </aside>
  );
};

export default BookmarksPanel;
