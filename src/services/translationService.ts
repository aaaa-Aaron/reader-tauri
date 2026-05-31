/**
 * 翻译服务层 - 调用Tauri Command
 */

import { invoke } from '@tauri-apps/api/core';
import type { TranslationRequest, TranslationResult } from '../types/translation';

export const translationService = {
  /**
   * 翻译文本
   */
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    return await invoke<TranslationResult>('translate_text', { request });
  },

  /**
   * 获取翻译缓存
   */
  async getCachedTranslation(word: string): Promise<TranslationResult | null> {
    return await invoke<TranslationResult | null>('get_cached_translation', { word });
  }
};
