/**
 * 统计服务层 - 调用Tauri Command
 */

import { invoke } from '@tauri-apps/api/core';
import type { VocabularyItem, QueryDetailItem, StatisticsSummary } from '../types/statistics';

export const statisticsService = {
  /**
   * 获取词汇列表
   */
  async getVocabularyList(): Promise<VocabularyItem[]> {
    return await invoke<VocabularyItem[]>('get_vocabulary_list');
  },

  /**
   * 获取词汇查询明细
   */
  async getQueryDetails(word: string): Promise<QueryDetailItem[]> {
    return await invoke<QueryDetailItem[]>('get_query_details', { word });
  },

  /**
   * 获取统计概览
   */
  async getStatisticsSummary(): Promise<StatisticsSummary> {
    return await invoke<StatisticsSummary>('get_statistics_summary');
  }
};
