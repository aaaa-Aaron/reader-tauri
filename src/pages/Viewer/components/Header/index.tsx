import React from 'react';
import { Link } from 'react-router-dom';
import type { Book } from '../../../../types/book';
import styles from '../../Viewer.module.css';

interface HeaderProps {
  book: Book;
  numPages: number;
  currentPage: number;
  showSidebarLeft: boolean;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({
  book,
  numPages,
  currentPage,
  showSidebarLeft,
  onToggleSidebar
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <Link to="/library" className={styles.backHomeBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回首页
        </Link>
        <h1 className={styles.headerTitle}>{book.title}</h1>
      </div>
      <div className={styles.headerCenter}>
        <div className={styles.pageInfo}>
          {numPages > 0 ? `第 ${currentPage} 页 / 共 ${numPages} 页` : '加载中...'}
        </div>
      </div>
      <div className={styles.headerRight}>
        <div className={styles.sidebarControls}>
          <button
            className={`${styles.sidebarToggleBtn} ${showSidebarLeft ? styles.active : ''}`}
            onClick={onToggleSidebar}
            title="显示/隐藏左侧目录"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
              <line x1="9" y1="6" x2="9" y2="18" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input type="text" placeholder="搜索文档..." className={styles.searchInput} />
          <button className={styles.searchBtn}>🔍</button>
        </div>
        <div className={styles.settings}>
          <button className={styles.settingsBtn}>⚙️</button>
          <div className={styles.settingsDropdown}>
            <button>主题设置</button>
            <button>显示设置</button>
            <button>快捷键</button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
