use crate::dto::{
    ApiTranslationResponse, DictionaryResult, QueryDetailItem, StatisticsSummary,
    TranslationRequest, TranslationResult, VocabularyItem,
};
use crate::errors::Result;
use crate::repositories::{
    AnnotationRepository, BookRepository, QueryRecordRepository, WordCacheRepository,
};
use mdict_rs::MdxFile;
use sqlx::SqlitePool;
use std::sync::Arc;

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

    pub async fn create_book(
        &self,
        title: &str,
        format: &str,
        path: &str,
        author: Option<&str>,
        file_size: Option<i64>,
    ) -> Result<crate::models::Book> {
        self.repo
            .create(title, format, path, author, file_size)
            .await
    }

    pub async fn delete_book(&self, id: i64) -> Result<()> {
        self.repo.delete(id).await
    }

    pub async fn search_books(&self, query: &str) -> Result<Vec<crate::models::Book>> {
        self.repo.search(query).await
    }

    pub async fn update_book(
        &self,
        id: i64,
        title: Option<&str>,
        author: Option<&str>,
        file_size: Option<i64>,
    ) -> Result<crate::models::Book> {
        self.repo.update(id, title, author, file_size).await
    }
}

/// 翻译服务
pub struct TranslationService {
    word_cache_repo: WordCacheRepository,
    query_record_repo: QueryRecordRepository,
    mdx_dict: Arc<MdxFile>,
    http_client: reqwest::Client,
}

impl TranslationService {
    pub fn new(pool: SqlitePool, mdx_dict: Arc<MdxFile>) -> Self {
        Self {
            word_cache_repo: WordCacheRepository::new(pool.clone()),
            query_record_repo: QueryRecordRepository::new(pool),
            mdx_dict,
            http_client: reqwest::Client::new(),
        }
    }

    pub async fn translate(&self, request: TranslationRequest) -> Result<TranslationResult> {
        let text = request.text.trim();
        let from = request.from.as_deref().unwrap_or("auto");
        let to = request.to.as_deref().unwrap_or("zh-CHS");

        // 1. 尝试 MDX 词典精确匹配
        if let Ok(Some(record)) = self.mdx_dict.lookup(text) {
            let definition = record.text;

            // 检查是否为链接引用 (@@@LINK=主词条)
            let final_definition = if definition.starts_with("@@@LINK=") {
                let linked_word = definition.trim_start_matches("@@@LINK=").trim();
                if let Ok(Some(linked_record)) = self.mdx_dict.lookup(linked_word) {
                    linked_record.text
                } else {
                    definition // 如果链接查询失败，返回原始链接文本
                }
            } else {
                definition
            };

            let query_type = if text.len() > 20 { "sentence" } else { "word" };
            self.query_record_repo
                .create(
                    text,
                    from,
                    to,
                    request.book_id,
                    request.context.as_deref(),
                    query_type,
                )
                .await
                .ok();

            return Ok(TranslationResult {
                original_text: text.to_string(),
                data_source: "dictionary".to_string(),
                dictionary_result: Some(DictionaryResult {
                    word: text.to_string(),
                    definition: final_definition,
                }),
                api_result: None,
                success: true,
            });
        }

        // 2. 检查缓存
        if let Some(cache) = self.word_cache_repo.find_by_word(text, from, to).await? {
            let explains = cache
                .explains
                .map(|e| serde_json::from_str(&e).unwrap_or_default());

            let query_type = if text.len() > 20 { "sentence" } else { "word" };
            self.query_record_repo
                .create(
                    text,
                    from,
                    to,
                    request.book_id,
                    request.context.as_deref(),
                    query_type,
                )
                .await
                .ok();

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

        // 4. 调用在线API
        let result = self.call_translation_api(text, from, to).await;

        // 缓存结果
        if let Ok(ref api_result) = result {
            let explains_str = api_result
                .explains
                .as_ref()
                .map(|e| serde_json::to_string(e).unwrap_or_default());
            self.word_cache_repo
                .create(
                    text,
                    from,
                    to,
                    &api_result.translated,
                    api_result.phonetic.as_deref(),
                    explains_str.as_deref(),
                )
                .await
                .ok();
        }

        let query_type = if text.len() > 20 { "sentence" } else { "word" };
        self.query_record_repo
            .create(
                text,
                from,
                to,
                request.book_id,
                request.context.as_deref(),
                query_type,
            )
            .await
            .ok();

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

    async fn call_translation_api(
        &self,
        text: &str,
        from: &str,
        to: &str,
    ) -> Result<ApiTranslationResponse> {
        // 有道翻译API配置
        // 请替换为您自己的有道API凭证，或设置环境变量 YOUDAO_APP_ID 和 YOUDAO_APP_SECRET
        let app_id = std::env::var("YOUDAO_APP_ID").unwrap_or_else(|_| "your_app_id".to_string());
        let app_secret =
            std::env::var("YOUDAO_APP_SECRET").unwrap_or_else(|_| "your_app_secret".to_string());

        let salt = uuid::Uuid::new_v4().to_string();
        let curtime = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
            .to_string();

        // 签名: MD5(appid + q + salt + curtime + appsecret)
        let sign_str = format!("{}{}{}{}{}", app_id, text, salt, curtime, app_secret);
        let sign = format!("{:x}", md5::compute(sign_str.as_bytes()));

        let params = [
            ("q", text),
            ("from", from),
            ("to", to),
            ("appKey", &app_id),
            ("salt", &salt),
            ("sign", &sign),
            ("signType", "v2"),
            ("curtime", &curtime),
        ];

        let response = self
            .http_client
            .post("https://openapi.youdao.com/api")
            .form(&params)
            .send()
            .await?;

        let json: serde_json::Value = response.json().await?;

        // 解析有道API响应
        if json["errorCode"].as_str() != Some("0") {
            return Ok(ApiTranslationResponse {
                original: text.to_string(),
                translated: format!(
                    "翻译失败: {}",
                    json["errorCode"].as_str().unwrap_or("未知错误")
                ),
                source: from.to_string(),
                target: to.to_string(),
                phonetic: None,
                explains: None,
            });
        }

        let translation = json["translation"][0].as_str().unwrap_or(text);

        Ok(ApiTranslationResponse {
            original: text.to_string(),
            translated: translation.to_string(),
            source: from.to_string(),
            target: to.to_string(),
            phonetic: None,
            explains: None,
        })
    }

    pub async fn get_cached_translation(&self, _word: &str) -> Result<Option<TranslationResult>> {
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
        Ok(rows
            .into_iter()
            .enumerate()
            .map(|(i, (word, count, last_time))| VocabularyItem {
                id: i as i64 + 1,
                word,
                lookup_count: count,
                last_lookup_time: last_time,
            })
            .collect())
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

/// 注解服务
pub struct AnnotationService {
    repo: AnnotationRepository,
}

impl AnnotationService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            repo: AnnotationRepository::new(pool),
        }
    }

    pub async fn get_annotations(&self, book_id: i64) -> Result<Vec<crate::models::Annotation>> {
        self.repo.find_by_book_id(book_id).await
    }

    pub async fn create_annotation(
        &self,
        book_id: i64,
        content: &str,
        position: &str,
        cfi: Option<&str>,
    ) -> Result<crate::models::Annotation> {
        self.repo.create(book_id, content, position, cfi).await
    }

    pub async fn delete_annotation(&self, id: i64) -> Result<()> {
        self.repo.delete(id).await
    }

    pub async fn get_annotations_by_cfi(
        &self,
        book_id: i64,
        cfi: &str,
    ) -> Result<Vec<crate::models::Annotation>> {
        self.repo.find_by_cfi(book_id, cfi).await
    }

    pub async fn update_annotation(
        &self,
        id: i64,
        content: &str,
    ) -> Result<crate::models::Annotation> {
        self.repo.update_content(id, content).await
    }
}
