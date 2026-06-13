import React, { useState } from 'react';
import styles from '../Sidebar/Sidebar.module.css';

interface TableOfContentsProps {
  outline: any[];
  onPageClick?: (dest: any, item: any) => void;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ outline, onPageClick }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderOutlineItems = (items: any[], parentId: string = '') => {
    if (!items || items.length === 0) return null;

    return items.map((item, index) => {
      const hasChildren = item.items && Array.isArray(item.items) && item.items.length > 0;
      const itemId = `${parentId}-${index}`;
      const isExpanded = expandedIds.has(itemId);
      const itemClass = `${styles.tocItem} ${hasChildren ? styles.hasChildren : ''} ${isExpanded ? styles.expanded : ''}`;

      const handleTitleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.dest && onPageClick) {
          onPageClick(item.dest, item);
        }
      };

      const handleExpandClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasChildren) {
          toggleExpand(itemId);
        }
      };

      const trimmedTitle = item.title?.trim() || '';

      return (
        <li key={itemId} className={itemClass}>
          <button
            onClick={handleTitleClick}
            disabled={!item.dest}
            className={hasChildren ? styles.hasChildrenBtn : ''}
          >
            {hasChildren && (
              <span
                className={styles.expandIcon}
                onClick={handleExpandClick}
              >
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            <span className={styles.tocTitle}>{trimmedTitle}</span>
          </button>
          {hasChildren && (
            <ul className={`${styles.tocChildren} ${isExpanded ? styles.expanded : ''}`}>
              {renderOutlineItems(item.items, itemId)}
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
