use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// 图书实体
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Book {
    pub id: i64,
    pub title: String,
    pub format: String,
    pub path: String,
    pub upload_time: DateTime<Utc>,
    pub author: Option<String>,
    pub file_size: Option<i64>,
}

/// 查词记录实体
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct QueryRecord {
    pub id: i64,
    pub original_text: String,
    pub source_language: String,
    pub target_language: String,
    pub book_id: Option<i64>,
    pub context: Option<String>,
    pub query_type: String,
    pub created_at: DateTime<Utc>,
}

/// 翻译缓存实体
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WordCache {
    pub id: i64,
    pub word: String,
    pub source_language: String,
    pub target_language: String,
    pub translated: String,
    pub phonetic: Option<String>,
    pub explains: Option<String>,
}

/// 词典条目实体
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DictionaryEntry {
    pub word: String,
    pub definition: String,
}
