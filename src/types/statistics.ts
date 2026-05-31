/**
 * 统计类型定义
 */

export interface VocabularyItem {
  id: number;
  word: string;
  lookupCount: number;
  lastLookupTime: string;
}

export interface QueryDetailItem {
  id: number;
  word: string;
  context?: string;
  bookTitle?: string;
  lookupTime: string;
}

export interface StatisticsSummary {
  totalLookups: number;
  uniqueWords: number;
  mostLookedUpWord: string;
  averageLookupsPerWord: number;
}
