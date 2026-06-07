use sqlx::SqlitePool;

pub mod book_commands;
pub mod file_commands;
pub mod translate_commands;
pub mod statistics_commands;

pub struct AppState {
    pub db_pool: SqlitePool,
    pub dict_pool: SqlitePool,
}

pub use book_commands::*;
pub use file_commands::*;
pub use translate_commands::*;
pub use statistics_commands::*;