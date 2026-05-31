use crate::commands::AppState;
use std::sync::Arc;
use tauri::{Manager, State};

/// 读取文件内容为字节数组
#[tauri::command]
pub async fn read_file_bytes(path: String, _state: State<'_, Arc<AppState>>) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| e.to_string())
}

/// 获取应用数据目录
#[tauri::command]
pub async fn get_app_data_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    app_handle
        .path()
        .app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

/// 确保目录存在
#[tauri::command]
pub async fn ensure_dir(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())
}
