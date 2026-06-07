import React from 'react';
import styles from '../../Viewer.module.css';

interface TableOfContentsProps {
  outline: any[];
  onPageClick?: (dest: any, item: any) => void;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ outline, onPageClick }) => {
  const renderOutlineItems = (items: any[]) => {
    if (!items || items.length === 0) return null;

    return items.map((item, index) => {
      const hasChildren = item.items && Array.isArray(item.items) && item.items.length > 0;
      const itemClass = `${styles.tocItem} ${hasChildren ? styles.hasChildren : ''}`;

      return (
        <li key={index} className={itemClass}>
          <button
            onClick={() => item.dest && onPageClick?.(item.dest, item)}
            disabled={!item.dest || !onPageClick}
          >
            {item.title}
          </button>
          {hasChildren && (
            <ul className={styles.tocChildren}>
              {renderOutlineItems(item.items)}
            </ul>
          )}
        </li>
      );
    });
  };

  return (
    <ul className={styles.tocList}>
      {outline.length > 0 ? (
        renderOutlineItems(outline)
      ) : (
        <li className={styles.tocItem}>
          <button>No table of contents available</button>
        </li>
      )}
    </ul>
  );
};

export default TableOfContents;
