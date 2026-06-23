/**
 * 统计服务层 - 调用Tauri Command
 */

import { invoke } from '@tauri-apps/api/core';

export interface VocabularyItem {
  id: number;
  word: string;
  queryCount: number;
  lastQueryAt: string;
  lookupCount?: number;
  lastLookupTime?: string;
}

export interface QueryDetailItem {
  id: number;
  word: string;
  queryTime: string;
  context?: string;
}

export interface StatisticsSummary {
  totalBooks: number;
  totalReadingTime: number;
  totalVocabulary: number;
  totalLookups: number;
  uniqueWords: number;
  mostLookedUpWord?: string;
  averageLookupsPerWord: number;
  recentBooks: {
    id: number;
    title: string;
    progress: number;
  }[];
}

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
