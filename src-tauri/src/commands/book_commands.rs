use crate::dto::{CreateBookRequest, UpdateBookRequest};
use crate::models::Book;
use crate::services::BookService;
use std::sync::Arc;
use tauri::State;
use super::AppState;

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
pub async fn update_book(request: UpdateBookRequest, state: State<'_, Arc<AppState>>) -> Result<Book, String> {
    let service = BookService::new(state.db_pool.clone());
    service.update_book(
        request.id,
        request.title.as_deref(),
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