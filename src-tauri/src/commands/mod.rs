use mdict_rs::MdxFile;
use sqlx::SqlitePool;
use std::sync::Arc;

pub mod annotation_commands;
pub mod book_commands;
pub mod file_commands;
pub mod translate_commands;
pub mod statistics_commands;

pub struct AppState {
    pub db_pool: SqlitePool,
    pub mdx_dict: Arc<MdxFile>,
}

pub use annotation_commands::*;
pub use book_commands::*;
pub use file_commands::*;
pub use translate_commands::*;
pub use statistics_commands::*;