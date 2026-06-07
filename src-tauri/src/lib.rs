pub mod commands;
pub mod dto;
pub mod errors;
pub mod models;
pub mod repositories;
pub mod services;
pub mod utils;

#[cfg(test)]
mod tests;

use commands::AppState;
use sqlx::sqlite::SqlitePoolOptions;
use std::sync::Arc;
use tauri::Manager;

/// Initialize database
async fn init_db(app_handle: &tauri::AppHandle) -> Result<sqlx::SqlitePool, Box<dyn std::error::Error>> {
    let app_dir = app_handle.path().app_data_dir()?;
    std::fs::create_dir_all(&app_dir)?;
    
    let db_path = app_dir.join("e_reader.db");
    // let db_url = format!("sqlite:{}", db_path.to_str().unwrap());
    let db_url = "C:/Users/Aaron/AppData/Roaming/com.aaron.e-reader-tauri/e_reader.db";
    // println!("{}", db_url);
    // println!("db_path{:?}",db_path);
    
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(db_url)
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

/// Initialize dictionary database (read-only)
async fn init_dict_db(app_handle: &tauri::AppHandle) -> Result<sqlx::SqlitePool, Box<dyn std::error::Error>> {
    let app_dir = app_handle.path().app_data_dir()?;
    let dict_dir = app_dir.join("dict");
    std::fs::create_dir_all(&dict_dir)?;
    
    let dict_dest = dict_dir.join("LongmanDictionaryOfContemporaryEnglish6thEnEn.db");

    // If dictionary DB doesn't exist in app data, try to copy from bundled resources
    if !dict_dest.exists() {
        // Try resource dir first
        if let Ok(resource_dir) = app_handle.path().resource_dir() {
            let bundled_dict = resource_dir.join("dict").join("LongmanDictionaryOfContemporaryEnglish6thEnEn.db");
            if bundled_dict.exists() {
                std::fs::copy(&bundled_dict, &dict_dest)?;
                println!("Dictionary DB copied from resource dir");
            }
        }
        
        // If still not found, try dev directory
        if !dict_dest.exists() {
            let dev_dict = std::path::PathBuf::from("dict/LongmanDictionaryOfContemporaryEnglish6thEnEn.db");
            if dev_dict.exists() {
                std::fs::copy(&dev_dict, &dict_dest)?;
                println!("Dictionary DB copied from dev directory");
            }
        }
    }

    if !dict_dest.exists() {
        return Err("Dictionary DB not found".into());
    }

    let dict_url = format!("sqlite:{}", dict_dest.to_str().unwrap());
    
    let pool = SqlitePoolOptions::new()
        .max_connections(2)
        .connect(&dict_url)
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
                        // Initialize dictionary DB
                        let dict_pool = match init_dict_db(&app_handle).await {
                            Ok(dp) => {
                                println!("Dictionary database initialized successfully");
                                dp
                            }
                            Err(e) => {
                                eprintln!("Failed to initialize dictionary DB (non-fatal): {}", e);
                                // Use main pool as fallback (won't have mdx table but won't crash)
                                pool.clone()
                            }
                        };

                        let state = Arc::new(AppState { db_pool: pool, dict_pool });
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
            commands::update_book,
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
