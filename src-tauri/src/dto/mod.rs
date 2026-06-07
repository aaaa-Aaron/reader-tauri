use serde::{Deserialize, Serialize};

/// 创建图书请求
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBookRequest {
    pub title: String,
    pub format: String,
    pub file_path: String,
    pub author: Option<String>,
    pub file_size: Option<i64>,
}

/// 更新图书请求
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateBookRequest {
    pub id: i64,
    pub title: Option<String>,
    pub author: Option<String>,
    pub file_size: Option<i64>,
}

/// 翻译请求
#[derive(Debug, Clone, Deserialize)]
pub struct TranslationRequest {
    pub text: String,
    pub from: Option<String>,
    pub to: Option<String>,
    pub book_id: Option<i64>,
    pub context: Option<String>,
}

/// API翻译响应
#[derive(Debug, Clone, Serialize)]
pub struct ApiTranslationResponse {
    pub original: String,
    pub translated: String,
    pub source: String,
    pub target: String,
    pub phonetic: Option<String>,
    pub explains: Option<Vec<String>>,
}

/// 翻译结果
#[derive(Debug, Clone, Serialize)]
pub struct TranslationResult {
    pub original_text: String,
    pub data_source: String,
    pub dictionary_result: Option<DictionaryResult>,
    pub api_result: Option<ApiTranslationResponse>,
    pub success: bool,
}

/// 词典结果
#[derive(Debug, Clone, Serialize)]
pub struct DictionaryResult {
    pub word: String,
    pub definition: String,
}

/// 词汇项
#[derive(Debug, Clone, Serialize)]
pub struct VocabularyItem {
    pub id: i64,
    pub word: String,
    pub lookup_count: i64,
    pub last_lookup_time: String,
}

/// 查询明细项
#[derive(Debug, Clone, Serialize)]
pub struct QueryDetailItem {
    pub id: i64,
    pub word: String,
    pub context: Option<String>,
    pub book_title: Option<String>,
    pub lookup_time: String,
}

/// 统计概览
#[derive(Debug, Clone, Serialize)]
pub struct StatisticsSummary {
    pub total_lookups: i64,
    pub unique_words: i64,
    pub most_looked_up_word: String,
    pub average_lookups_per_word: f64,
}
