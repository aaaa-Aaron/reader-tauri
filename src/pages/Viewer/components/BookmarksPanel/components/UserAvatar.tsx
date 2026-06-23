import React from 'react';
import styles from '../BookmarksPanel.module.css';
import type { User } from '../types';

interface UserAvatarProps {
  user: User;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => (
  <div className={styles.userInfo}>
    <div className={styles.avatar}>{user.avatar}</div>
    <span className={styles.userName}>{user.name}</span>
  </div>
);
