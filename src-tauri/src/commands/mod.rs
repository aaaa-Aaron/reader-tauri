use crate::dto::{CreateBookRequest, TranslationRequest, TranslationResult, VocabularyItem, QueryDetailItem, StatisticsSummary};
use crate::models::Book;
use crate::services::{BookService, TranslationService, StatisticsService};
use sqlx::SqlitePool;
use std::sync::Arc;
use tauri::State;

/// Application state
pub struct AppState {
    pub db_pool: SqlitePool,
}

// Book Commands

#[tauri::command]
pub async fn get_all_books(state: State<'_, Arc<AppState>>) -> Result<Vec<Book>, String> {
    let service = BookService::new(state.db_pool.clone());
    service.get_all_books().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_book_by_id(id: i64, state: State<'_, Arc<AppState>>) -> Result<Option<Book>, String> {
    let service = BookService::new(state.db_pool.clone());
    service.get_book_by_id(id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_book(request: CreateBookRequest, state: State<'_, Arc<AppState>>) -> Result<Book, String> {
    let service = BookService::new(state.db_pool.clone());
    service.create_book(
        &request.title,
        &request.format,
        &request.file_path,
        request.author.as_deref(),
        request.file_size,
    ).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_book(id: i64, state: State<'_, Arc<AppState>>) -> Result<(), String> {
    let service = BookService::new(state.db_pool.clone());
    service.delete_book(id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_books(query: String, state: State<'_, Arc<AppState>>) -> Result<Vec<Book>, String> {
    let service = BookService::new(state.db_pool.clone());
    service.search_books(&query).await.map_err(|e| e.to_string())
}

// Translation Commands

#[tauri::command]
pub async fn translate_text(request: TranslationRequest, state: State<'_, Arc<AppState>>) -> Result<TranslationResult, String> {
    let service = TranslationService::new(state.db_pool.clone());
    service.translate(request).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_cached_translation(word: String, state: State<'_, Arc<AppState>>) -> Result<Option<TranslationResult>, String> {
    let service = TranslationService::new(state.db_pool.clone());
    service.get_cached_translation(&word).await.map_err(|e| e.to_string())
}

// Statistics Commands

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
