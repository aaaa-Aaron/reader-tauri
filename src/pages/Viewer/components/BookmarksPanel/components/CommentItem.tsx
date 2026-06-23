import React from 'react';
import styles from '../BookmarksPanel.module.css';
import type { Comment } from '../types';
import { UserAvatar } from './UserAvatar';

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => (
  <div className={styles.commentItem}>
    <div className={styles.commentHeader}>
      <UserAvatar user={comment.user} />
      <span className={styles.time}>{comment.createdAt}</span>
    </div>
    <div className={styles.commentContent}>{comment.content}</div>

    {/* 回复列表 */}
    {comment.replies && comment.replies.length > 0 && (
      <div className={styles.replies}>
        {comment.replies.map((reply) => (
          <div key={reply.id} className={styles.replyItem}>
            <UserAvatar user={reply.user} />
            <div className={styles.replyContent}>{reply.content}</div>
            <span className={styles.time}>{reply.createdAt}</span>
          </div>
        ))}
      </div>
    )}

    <div className={styles.commentActions}>
      <button className={styles.actionBtn}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        回复
      </button>
      <button className={styles.actionBtn}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 8H4" />
          <path d="M14 14H4" />
        </svg>
      </button>
    </div>
  </div>
);
