import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

interface HeaderProps {
  showSidebarLeft: boolean;
  onToggleSidebar: () => void;
  onToggleBookmarks?: () => void;
  translationEnabled?: boolean;
  onToggleTranslation?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  showSidebarLeft,
  onToggleSidebar,
  onToggleBookmarks,
  translationEnabled = true,
  onToggleTranslation
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
          {onToggleBookmarks && (
            <button
              className={styles.bookmarkBtn}
              onClick={onToggleBookmarks}
              title="注解和对话"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5" />
                <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v13z" />
                <path d="M14 2H6a2 2 0 0 0-2 2v3" />
              </svg>
            </button>
          )}
          {onToggleTranslation && (
            <button
              className={`${styles.translationToggleBtn} ${translationEnabled ? styles.active : ''}`}
              onClick={onToggleTranslation}
              title={translationEnabled ? '关闭划词翻译' : '开启划词翻译'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17c-.64.64-1.49 1.25-2.57 1.82-1.14.59-2.2.94-2.2.94L1 19l2-2.5c.34.03 1.76.08 3.44-.13.74-.09 1.37-.23 1.87-.42l.54.54-2.05 2.05 1.41 1.41L9.22 14.5l.71-.71c.53-.53 1-.98 1.4-1.35l.54.54-2.05 2.05 1.41 1.41 2.05-2.05.54.54c-.4.67-.88 1.32-1.4 1.85l4.24 4.24 1.41-1.41-4.24-4.24.54-.54c.53.53 1.4 1.4 2.57 2.07z" />
              </svg>
            </button>
          )}
          <div className={styles.settings}>
            <button className={styles.settingsBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
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