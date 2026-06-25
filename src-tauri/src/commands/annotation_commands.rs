use crate::models::Annotation;
use crate::services::AnnotationService;
use std::sync::Arc;
use tauri::State;
use super::AppState;

#[tauri::command]
pub async fn get_annotations(
    book_id: i64,
    state: State<'_, Arc<AppState>>,
) -> Result<Vec<Annotation>, String> {
    let service = AnnotationService::new(state.db_pool.clone());
    service.get_annotations(book_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_annotation(
    book_id: i64,
    content: String,
    position: String,
    cfi: Option<String>,
    state: State<'_, Arc<AppState>>,
) -> Result<Annotation, String> {
    let service = AnnotationService::new(state.db_pool.clone());
    service
        .create_annotation(book_id, &content, &position, cfi.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_annotation(
    id: i64,
    state: State<'_, Arc<AppState>>,
) -> Result<(), String> {
    let service = AnnotationService::new(state.db_pool.clone());
    service.delete_annotation(id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_annotations_by_cfi(
    book_id: i64,
    cfi: String,
    state: State<'_, Arc<AppState>>,
) -> Result<Vec<Annotation>, String> {
    let service = AnnotationService::new(state.db_pool.clone());
    service.get_annotations_by_cfi(book_id, &cfi).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_annotation(
    id: i64,
    content: String,
    state: State<'_, Arc<AppState>>,
) -> Result<Annotation, String> {
    let service = AnnotationService::new(state.db_pool.clone());
    service.update_annotation(id, &content).await.map_err(|e| e.to_string())
}