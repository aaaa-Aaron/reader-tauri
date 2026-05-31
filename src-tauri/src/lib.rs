pub mod commands;
pub mod dto;
pub mod errors;
pub mod models;
pub mod repositories;
pub mod services;
pub mod utils;

use commands::AppState;
use sqlx::sqlite::SqlitePoolOptions;
use std::sync::Arc;
use tauri::Manager;

/// Initialize database
async fn init_db(app_handle: &tauri::AppHandle) -> Result<sqlx::SqlitePool, Box<dyn std::error::Error>> {
    let app_dir = app_handle.path().app_data_dir()?;
    std::fs::create_dir_all(&app_dir)?;
    
    let db_path = app_dir.join("e_reader.db");
    let db_url = format!("sqlite:{}", db_path.to_str().unwrap());
    
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;
    
    // Create tables
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            format TEXT NOT NULL,
            path TEXT NOT NULL,
            upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            author TEXT,
            file_size INTEGER
        )
        "#
    )
    .execute(&pool)
    .await?;
    
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS query_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_text TEXT NOT NULL,
            source_language TEXT NOT NULL,
            target_language TEXT NOT NULL,
            book_id INTEGER,
            context TEXT,
            query_type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES books(id)
        )
        "#
    )
    .execute(&pool)
    .await?;
    
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS word_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT NOT NULL,
            source_language TEXT NOT NULL,
            target_language TEXT NOT NULL,
            translated TEXT NOT NULL,
            phonetic TEXT,
            explains TEXT,
            UNIQUE(word, source_language, target_language)
        )
        "#
    )
    .execute(&pool)
    .await?;
    
    Ok(pool)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            tauri::async_runtime::block_on(async move {
                match init_db(&app_handle).await {
                    Ok(pool) => {
                        let state = Arc::new(AppState { db_pool: pool });
                        app_handle.manage(state);
                        println!("Database initialized successfully");
                    }
                    Err(e) => {
                        eprintln!("Failed to initialize database: {}", e);
                    }
                }
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_all_books,
            commands::get_book_by_id,
            commands::create_book,
            commands::delete_book,
            commands::search_books,
            commands::translate_text,
            commands::get_cached_translation,
            commands::get_vocabulary_list,
            commands::get_query_details,
            commands::get_statistics_summary,
            commands::read_file_bytes,
            commands::get_app_data_dir,
            commands::ensure_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
