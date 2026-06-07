use crate::dto::{TranslationRequest, TranslationResult};
use crate::services::TranslationService;
use std::sync::Arc;
use tauri::State;
use super::AppState;

#[tauri::command]
pub async fn translate_text(request: TranslationRequest, state: State<'_, Arc<AppState>>) -> Result<TranslationResult, String> {
    let service = TranslationService::new(state.db_pool.clone(), state.dict_pool.clone());
    service.translate(request).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_cached_translation(word: String, state: State<'_, Arc<AppState>>) -> Result<Option<TranslationResult>, String> {
    let service = TranslationService::new(state.db_pool.clone(), state.dict_pool.clone());
    service.get_cached_translation(&word).await.map_err(|e| e.to_string())
}