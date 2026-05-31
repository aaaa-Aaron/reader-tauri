use crate::dto::{TranslationRequest, TranslationResult, VocabularyItem, QueryDetailItem, StatisticsSummary, ApiTranslationResponse};
use crate::errors::Result;
use crate::repositories::{BookRepository, QueryRecordRepository, WordCacheRepository};
use sqlx::SqlitePool;

/// 图书服务
pub struct BookService {
    repo: BookRepository,
}

impl BookService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            repo: BookRepository::new(pool),
        }
    }

    pub async fn get_all_books(&self) -> Result<Vec<crate::models::Book>> {
        self.repo.find_all().await
    }

    pub async fn get_book_by_id(&self, id: i64) -> Result<Option<crate::models::Book>> {
        self.repo.find_by_id(id).await
    }

    pub async fn create_book(&self, title: &str, format: &str, path: &str, author: Option<&str>, file_size: Option<i64>) -> Result<crate::models::Book> {
        self.repo.create(title, format, path, author, file_size).await
    }

    pub async fn delete_book(&self, id: i64) -> Result<()> {
        self.repo.delete(id).await
    }

    pub async fn search_books(&self, query: &str) -> Result<Vec<crate::models::Book>> {
        self.repo.search(query).await
    }
}

/// 翻译服务
pub struct TranslationService {
    word_cache_repo: WordCacheRepository,
    query_record_repo: QueryRecordRepository,
    http_client: reqwest::Client,
}

impl TranslationService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            word_cache_repo: WordCacheRepository::new(pool.clone()),
            query_record_repo: QueryRecordRepository::new(pool),
            http_client: reqwest::Client::new(),
        }
    }

    pub async fn translate(&self, request: TranslationRequest) -> Result<TranslationResult> {
        let text = request.text.trim();
        let from = request.from.as_deref().unwrap_or("auto");
        let to = request.to.as_deref().unwrap_or("zh-CHS");

        // 1. Check cache first
        if let Some(cache) = self.word_cache_repo.find_by_word(text, from, to).await? {
            let explains = cache.explains.map(|e| serde_json::from_str(&e).unwrap_or_default());
            
            // Record query
            let query_type = if text.len() > 20 { "sentence" } else { "word" };
            self.query_record_repo.create(text, from, to, request.book_id, request.context.as_deref(), query_type).await.ok();

            return Ok(TranslationResult {
                original_text: text.to_string(),
                data_source: "cache".to_string(),
                dictionary_result: None,
                api_result: Some(ApiTranslationResponse {
                    original: text.to_string(),
                    translated: cache.translated,
                    source: from.to_string(),
                    target: to.to_string(),
                    phonetic: cache.phonetic,
                    explains,
                }),
                success: true,
            });
        }

        // 2. Call API (simplified version without dictionary lookup for now)
        let result = self.call_translation_api(text, from, to).await;

        // 3. Cache and record
        if let Ok(ref api_result) = result {
            let explains_str = api_result.explains.as_ref().map(|e| serde_json::to_string(e).unwrap_or_default());
            self.word_cache_repo.create(text, from, to, &api_result.translated, api_result.phonetic.as_deref(), explains_str.as_deref()).await.ok();
        }

        let query_type = if text.len() > 20 { "sentence" } else { "word" };
        self.query_record_repo.create(text, from, to, request.book_id, request.context.as_deref(), query_type).await.ok();

        match result {
            Ok(api_result) => Ok(TranslationResult {
                original_text: text.to_string(),
                data_source: "api".to_string(),
                dictionary_result: None,
                api_result: Some(api_result),
                success: true,
            }),
            Err(_) => Ok(TranslationResult {
                original_text: text.to_string(),
                data_source: "api".to_string(),
                dictionary_result: None,
                api_result: None,
                success: false,
            }),
        }
    }

    async fn call_translation_api(&self, text: &str, from: &str, to: &str) -> Result<ApiTranslationResponse> {
        // Simplified mock implementation
        // In real implementation, call Youdao API here
        Ok(ApiTranslationResponse {
            original: text.to_string(),
            translated: format!("[Translated] {}", text),
            source: from.to_string(),
            target: to.to_string(),
            phonetic: None,
            explains: None,
        })
    }

    pub async fn get_cached_translation(&self, _word: &str) -> Result<Option<TranslationResult>> {
        // Simplified implementation
        Ok(None)
    }
}

/// 统计服务
pub struct StatisticsService {
    query_repo: QueryRecordRepository,
    book_repo: BookRepository,
}

impl StatisticsService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            query_repo: QueryRecordRepository::new(pool.clone()),
            book_repo: BookRepository::new(pool),
        }
    }

    pub async fn get_vocabulary_list(&self) -> Result<Vec<VocabularyItem>> {
        let rows = self.query_repo.get_vocabulary_list().await?;
        Ok(rows.into_iter().enumerate().map(|(i, (word, count, last_time))| VocabularyItem {
            id: i as i64 + 1,
            word,
            lookup_count: count,
            last_lookup_time: last_time,
        }).collect())
    }

    pub async fn get_query_details(&self, word: &str) -> Result<Vec<QueryDetailItem>> {
        let records = self.query_repo.get_query_details(word).await?;
        let mut result = Vec::new();
        
        for record in records {
            let book_title = if let Some(book_id) = record.book_id {
                self.book_repo.find_by_id(book_id).await?.map(|b| b.title)
            } else {
                None
            };

            result.push(QueryDetailItem {
                id: record.id,
                word: record.original_text,
                context: record.context,
                book_title,
                lookup_time: record.created_at.to_rfc3339(),
            });
        }

        Ok(result)
    }

    pub async fn get_statistics_summary(&self) -> Result<StatisticsSummary> {
        let (total, unique, most_looked_up, avg) = self.query_repo.get_summary().await?;
        Ok(StatisticsSummary {
            total_lookups: total,
            unique_words: unique,
            most_looked_up_word: most_looked_up.unwrap_or_default(),
            average_lookups_per_word: avg,
        })
    }
}
