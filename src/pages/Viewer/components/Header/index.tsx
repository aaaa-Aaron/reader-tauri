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
    <div className={styles.headerWrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/library" className={styles.backHomeBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.sidebarControls}>
            <button
              className={`${styles.sidebarToggleBtn} ${showSidebarLeft ? styles.active : ''}`}
              onClick={onToggleSidebar}
              title="显示/隐藏左侧目录"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
                <line x1="9" y1="6" x2="9" y2="18" strokeWidth="1.5" />
              </svg>
            </button>
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
    </div>
  );
};

export default Header;