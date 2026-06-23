/**
 * 文件服务层 - 调用Tauri FS API
 */

import { open } from '@tauri-apps/plugin-dialog';
import { readFile, copyFile, mkdir, stat } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';

export const fileService = {
  /**
   * 选择文件
   */
  async selectFile(options?: { filters?: { name: string; extensions: string[] }[] }): Promise<string | null> {
    const file = await open({
      multiple: false,
      directory: false,
      filters: options?.filters || [
        { name: 'Books', extensions: ['pdf', 'epub'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return file || null;
  },

  /**
   * 复制文件到应用数据目录
   */
  async copyToAppData(sourcePath: string, fileName: string): Promise<string> {
    const appData = await appDataDir();
    const booksDir = await join(appData, 'books');
    
    // Ensure books directory exists
    try {
      await mkdir(booksDir, { recursive: true });
    } catch {
      // Directory might already exist
    }
    
    const destPath = await join(booksDir, fileName);
    
    await copyFile(sourcePath, destPath);
    return destPath;
  },

  /**
   * 读取文件为Uint8Array
   */
  async readFileAsBytes(path: string): Promise<Uint8Array> {
    return await readFile(path);
  },

  /**
   * 通过Tauri Command读取文件（备用）
   */
  async readFileBytesViaCommand(path: string): Promise<number[]> {
    return await invoke<number[]>('read_file_bytes', { path });
  },

  /**
   * 获取文件大小
   */
  async getFileSize(path: string): Promise<number> {
    const fileInfo = await stat(path);
    return fileInfo.size;
  },

  /**
   * 获取应用数据目录
   */
  async getAppDataDir(): Promise<string> {
    return await invoke<string>('get_app_data_dir');
  }
};
