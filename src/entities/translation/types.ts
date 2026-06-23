// 翻译实体类型定义
export interface TranslationResult {
  word: string;
  dictionaryResult?: string;
  youdaoResult?: YoudaoTranslation;
  context?: string;
  original_text?: string;
  success?: boolean;
  data_source?: string;
  dictionary_result?: {
    definition?: string;
  };
  api_result?: {
    translated?: string;
    phonetic?: string;
    explains?: string[];
  };
}

export interface YoudaoTranslation {
  query: string;
  translation: string[];
  basic?: {
    phonetic?: string;
    'uk-phonetic'?: string;
    'us-phonetic'?: string;
    explains: string[];
  };
  web?: {
    key: string;
    value: string[];
  }[];
}

export interface DictionaryEntry {
  word: string;
  content: string;
}
