import React from 'react';
import TableOfContents from '../TableOfContents';
import styles from '../../Viewer.module.css';

interface SidebarProps {
  outline: any[];
  showSidebarLeft: boolean;
  onPageClick: (dest: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  outline,
  showSidebarLeft,
  onPageClick
}) => {
  return (
    <aside className={`${styles.leftSidebar} ${!showSidebarLeft ? styles.hidden : ''}`}>
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
