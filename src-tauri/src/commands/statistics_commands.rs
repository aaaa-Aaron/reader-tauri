use crate::dto::{VocabularyItem, QueryDetailItem, StatisticsSummary};
use crate::services::StatisticsService;
use std::sync::Arc;
use tauri::State;
use super::AppState;

#[tauri::command]
pub async fn get_vocabulary_list(state: State<'_, Arc<AppState>>) -> Result<Vec<VocabularyItem>, String> {
    let service = StatisticsService::new(state.db_pool.clone());
    service.get_vocabulary_list().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_query_details(word: String, state: State<'_, Arc<AppState>>) -> Result<Vec<QueryDetailItem>, String> {
    let service = StatisticsService::new(state.db_pool.clone());
    service.get_query_details(&word).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_statistics_summary(state: State<'_, Arc<AppState>>) -> Result<StatisticsSummary, String> {
    let service = StatisticsService::new(state.db_pool.clone());
    service.get_statistics_summary().await.map_err(|e| e.to_string())
}