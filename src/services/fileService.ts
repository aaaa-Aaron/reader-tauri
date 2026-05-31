/**
 * 文件服务层 - 调用Tauri FS API
 */

import { open, save } from '@tauri-apps/plugin-dialog';
import { copyFile, readFile } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';

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
    const destPath = await join(booksDir, fileName);
    
    await copyFile(sourcePath, destPath);
    return destPath;
  },

  /**
   * 读取文件为ArrayBuffer
   */
  async readFileAsArrayBuffer(path: string): Promise<Uint8Array> {
    return await readFile(path);
  }
};
