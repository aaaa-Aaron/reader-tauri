/**
 * 翻译类型定义
 */

export interface TranslationRequest {
  text: string;
  from?: string;
  to?: string;
  bookId?: number;
  context?: string;
}

export interface DictionaryEntry {
  word: string;
  definition: string;
}

export interface ApiTranslationResponse {
  original: string;
  translated: string;
  source: string;
  target: string;
  phonetic?: string;
  explains?: string[];
}

export enum DataSourceType {
  DICTIONARY = 'dictionary',
  API = 'api',
  CACHE = 'cache'
}

export interface TranslationResult {
  original_text: string;
  data_source: DataSourceType;
  dictionary_result?: DictionaryEntry;
  api_result?: ApiTranslationResponse;
  success: boolean;
}
