import React, { useState } from 'react';
import { Input } from 'antd';
import styles from './BookmarksPanel.module.css';

const { TextArea } = Input;

// 书签项类型
interface Bookmark {
  id: string;
  content: string;
  position: string;
  createdAt: string;
  user: {
    name: string;
    avatar: string;
  };
}

// 评论类型
interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    avatar: string;
  };
  replies?: Comment[];
}

// Mock 数据
const mockBookmarks: Bookmark[] = [
  {
    id: '1',
    content: '这是一段很重要的观点，需要重点关注：Code Review 等协作环节耗时下降',
    position: '第二章 - AI Coding 对人才结构的影响',
    createdAt: '2024-03-22 09:51',
    user: {
      name: '李润潮',
      avatar: 'L'
    }
  },
  {
    id: '2',
    content: '效率传导的四个层级这个概念很有意思，值得深入思考',
    position: '第三章 - 人才结构和能力模型的演进',
    createdAt: '2024-03-23 10:48',
    user: {
      name: '李润潮',
      avatar: 'L'
    }
  },
  {
    id: '3',
    content: '企业战略层面的变化是最终目标',
    position: '第四章 - 企业战略层面',
    createdAt: '2024-03-24 14:20',
    user: {
      name: '李润潮',
      avatar: 'L'
    }
  }
];

const mockComments: Comment[] = [
  {
    id: '1',
    content: '为什么有的人反馈反而需要花更多的时间检查 AI 写的代码有没有问题呢？是他们不会用 AI 吗？',
    createdAt: '2024-03-24 09:51',
    user: {
      name: '李润潮',
      avatar: 'L'
    },
    replies: [
      {
        id: '1-1',
        content: '总的时间实际是优化的，但是工程师的工作内容确实发生了变化。',
        createdAt: '2024-03-24 10:48',
        user: {
          name: '南斌',
          avatar: 'N'
        }
      }
    ]
  },
  {
    id: '2',
    content: '效率传导的四个层级这个模型很有启发性',
    createdAt: '2024-03-25 11:30',
    user: {
      name: '南斌',
      avatar: 'N'
    }
  }
];

interface BookmarksPanelProps {
  showSidebarRight: boolean;
  onClose: () => void;
}

const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
  showSidebarRight,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'comments'>('bookmarks');
  const [newComment, setNewComment] = useState('');
  const [bookmarks] = useState<Bookmark[]>(mockBookmarks);
  const [comments] = useState<Comment[]>(mockComments);

  if (!showSidebarRight) return null;

  return (
    <aside className={`${styles.sidebar} ${!showSidebarRight ? styles.hidden : ''}`}>
      {/* 头部 */}
      <div className={styles.header}>
        <div className={styles.tabs}>
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
        </div>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      {/* 内容区域 */}
      <div className={styles.content}>
        {activeTab === 'bookmarks' ? (
          <div className={styles.bookmarkList}>
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className={styles.bookmarkItem}>
                <div className={styles.bookmarkHeader}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>{bookmark.user.avatar}</div>
                    <span className={styles.userName}>{bookmark.user.name}</span>
                  </div>
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
            ))}

            {/* 添加新书签按钮 */}
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
              <div key={comment.id} className={styles.commentItem}>
                <div className={styles.commentHeader}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>{comment.user.avatar}</div>
                    <span className={styles.userName}>{comment.user.name}</span>
                  </div>
                  <span className={styles.time}>{comment.createdAt}</span>
                </div>
                <div className={styles.commentContent}>{comment.content}</div>

                {/* 回复列表 */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className={styles.replies}>
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className={styles.replyItem}>
                        <div className={styles.userInfo}>
                          <div className={styles.avatar}>{reply.user.avatar}</div>
                          <span className={styles.userName}>{reply.user.name}</span>
                        </div>
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
            ))}
          </div>
        )}
      </div>

      {/* 底部输入框 */}
      {activeTab === 'comments' && (
        <div className={styles.inputArea}>
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
        </div>
      )}
    </aside>
  );
};

export default BookmarksPanel;
