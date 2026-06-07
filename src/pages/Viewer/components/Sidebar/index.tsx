import React from 'react';
import TableOfContents from '../TableOfContents';
import styles from '../../Viewer.module.css';

interface SidebarProps {
  outline: any[];
  showSidebarLeft: boolean;
  onToggleSidebar: () => void;
  onPageClick: (dest: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  outline,
  showSidebarLeft,
  onToggleSidebar,
  onPageClick
}) => {
  return (
    <aside className={`${styles.leftSidebar} ${!showSidebarLeft ? styles.hidden : ''}`}>
      <div className={styles.sidebarHeader}>
        <h2>目录</h2>
        <button className={styles.sidebarToggle} onClick={onToggleSidebar}>☰</button>
      </div>
      <nav className={styles.tocNav}>
        <ul className={styles.tocList}>
          <TableOfContents
            outline={outline}
            onPageClick={onPageClick}
          />
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
