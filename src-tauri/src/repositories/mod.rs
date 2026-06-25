use crate::errors::Result;
use crate::models::{Annotation, Book, DictionaryEntry, QueryRecord, WordCache};
use sqlx::SqlitePool;

/// 图书仓储
pub struct BookRepository {
    pool: SqlitePool,
}

impl BookRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn find_all(&self) -> Result<Vec<Book>> {
        let books = sqlx::query_as::<_, Book>(
            r#"
            SELECT id, title, format, path, upload_time, author, file_size
            FROM books
            ORDER BY upload_time DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(books)
    }

    pub async fn find_by_id(&self, id: i64) -> Result<Option<Book>> {
        let book = sqlx::query_as::<_, Book>(
            r#"
            SELECT id, title, format, path, upload_time, author, file_size
            FROM books
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;
        Ok(book)
    }

    pub async fn create(
        &self,
        title: &str,
        format: &str,
        path: &str,
        author: Option<&str>,
        file_size: Option<i64>,
    ) -> Result<Book> {
        let id: i64 = sqlx::query_scalar(
            r#"
            INSERT INTO books (title, format, path, author, file_size, upload_time)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
            RETURNING id
            "#,
        )
        .bind(title)
        .bind(format)
        .bind(path)
        .bind(author)
        .bind(file_size)
        .fetch_one(&self.pool)
        .await?;

        self.find_by_id(id)
            .await?
            .ok_or_else(|| crate::errors::AppError::Unknown("Failed to create book".to_string()))
    }

    pub async fn delete(&self, id: i64) -> Result<()> {
        sqlx::query("DELETE FROM books WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn search(&self, query: &str) -> Result<Vec<Book>> {
        let pattern = format!("%{}%", query);
        let books = sqlx::query_as::<_, Book>(
            r#"
            SELECT id, title, format, path, upload_time, author, file_size
            FROM books
            WHERE title LIKE ?
            ORDER BY upload_time DESC
            "#,
        )
        .bind(pattern)
        .fetch_all(&self.pool)
        .await?;
        Ok(books)
    }

    pub async fn update(
        &self,
        id: i64,
        title: Option<&str>,
        author: Option<&str>,
        file_size: Option<i64>,
    ) -> Result<Book> {
        let book = self.find_by_id(id).await?.ok_or_else(|| {
            crate::errors::AppError::Unknown(format!("Book with id {} not found", id))
        })?;

        let new_title = title.unwrap_or(&book.title);
        let new_author = author.or(book.author.as_deref());
        let new_file_size = file_size.or(book.file_size);

        sqlx::query(
            r#"
            UPDATE books
            SET title = ?, author = ?, file_size = ?
            WHERE id = ?
            "#,
        )
        .bind(new_title)
        .bind(new_author)
        .bind(new_file_size)
        .bind(id)
        .execute(&self.pool)
        .await?;

        self.find_by_id(id)
            .await?
            .ok_or_else(|| crate::errors::AppError::Unknown("Failed to update book".to_string()))
    }
}

/// 查词记录仓储
pub struct QueryRecordRepository {
    pool: SqlitePool,
}

impl QueryRecordRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(
        &self,
        original_text: &str,
        source_language: &str,
        target_language: &str,
        book_id: Option<i64>,
        context: Option<&str>,
        query_type: &str,
    ) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO query_records (original_text, source_language, target_language, book_id, context, query_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            "#
        )
        .bind(original_text)
        .bind(source_language)
        .bind(target_language)
        .bind(book_id)
        .bind(context)
        .bind(query_type)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn get_vocabulary_list(&self) -> Result<Vec<(String, i64, String)>> {
        let rows: Vec<(String, i64, String)> = sqlx::query_as(
            r#"
            SELECT original_text as word, COUNT(*) as count, MAX(created_at) as last_time
            FROM query_records
            GROUP BY original_text
            ORDER BY count DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows)
    }

    pub async fn get_query_details(&self, word: &str) -> Result<Vec<QueryRecord>> {
        let records = sqlx::query_as::<_, QueryRecord>(
            r#"
            SELECT id, original_text, source_language, target_language, book_id, context, query_type, created_at
            FROM query_records
            WHERE original_text = ?
            ORDER BY created_at DESC
            "#
        )
        .bind(word)
        .fetch_all(&self.pool)
        .await?;
        Ok(records)
    }

    pub async fn get_summary(&self) -> Result<(i64, i64, Option<String>, f64)> {
        let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM query_records")
            .fetch_one(&self.pool)
            .await?;

        let unique: i64 =
            sqlx::query_scalar("SELECT COUNT(DISTINCT original_text) FROM query_records")
                .fetch_one(&self.pool)
                .await?;

        let most_looked_up: Option<String> = sqlx::query_scalar(
            r#"
            SELECT original_text
            FROM query_records
            GROUP BY original_text
            ORDER BY COUNT(*) DESC
            LIMIT 1
            "#,
        )
        .fetch_optional(&self.pool)
        .await?;

        let avg = if unique > 0 {
            total as f64 / unique as f64
        } else {
            0.0
        };

        Ok((total, unique, most_looked_up, avg))
    }
}

/// 翻译缓存仓储
pub struct WordCacheRepository {
    pool: SqlitePool,
}

impl WordCacheRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn find_by_word(
        &self,
        word: &str,
        source_language: &str,
        target_language: &str,
    ) -> Result<Option<WordCache>> {
        let cache = sqlx::query_as::<_, WordCache>(
            r#"
            SELECT id, word, source_language, target_language, translated, phonetic, explains
            FROM word_cache
            WHERE word = ? AND source_language = ? AND target_language = ?
            "#,
        )
        .bind(word)
        .bind(source_language)
        .bind(target_language)
        .fetch_optional(&self.pool)
        .await?;
        Ok(cache)
    }

    pub async fn create(
        &self,
        word: &str,
        source_language: &str,
        target_language: &str,
        translated: &str,
        phonetic: Option<&str>,
        explains: Option<&str>,
    ) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO word_cache (word, source_language, target_language, translated, phonetic, explains)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(word, source_language, target_language) DO UPDATE SET
            translated = excluded.translated,
            phonetic = excluded.phonetic,
            explains = excluded.explains
            "#
        )
        .bind(word)
        .bind(source_language)
        .bind(target_language)
        .bind(translated)
        .bind(phonetic)
        .bind(explains)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}

/// 词典仓储 - 查询本地朗文词典
pub struct DictionaryRepository {
    pool: SqlitePool,
}

impl DictionaryRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// 精确匹配查词
    pub async fn lookup_exact(&self, word: &str) -> Result<Vec<DictionaryEntry>> {
        let entries = sqlx::query_as::<_, DictionaryEntry>(
            "SELECT entry as word, paraphrase as definition FROM mdx WHERE LOWER(entry) = LOWER(?)",
        )
        .bind(word.to_lowercase())
        .fetch_all(&self.pool)
        .await?;
        Ok(entries)
    }

    /// 模糊匹配查词
    pub async fn lookup_fuzzy(&self, word: &str) -> Result<Vec<DictionaryEntry>> {
        let pattern = format!("%{}%", word.to_lowercase());
        let entries = sqlx::query_as::<_, DictionaryEntry>(
            "SELECT entry as word, paraphrase as definition FROM mdx WHERE LOWER(entry) LIKE LOWER(?) LIMIT 10"
        )
        .bind(pattern)
        .fetch_all(&self.pool)
        .await?;
        Ok(entries)
    }
}

/// 注解仓储
pub struct AnnotationRepository {
    pool: SqlitePool,
}

impl AnnotationRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn find_by_book_id(&self, book_id: i64) -> Result<Vec<Annotation>> {
        let annotations = sqlx::query_as::<_, Annotation>(
            r#"
            SELECT id, book_id, content, position, cfi, created_at
            FROM bookmarks
            WHERE book_id = ?
            ORDER BY created_at DESC
            "#,
        )
        .bind(book_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(annotations)
    }

    pub async fn create(
        &self,
        book_id: i64,
        content: &str,
        position: &str,
        cfi: Option<&str>,
    ) -> Result<Annotation> {
        let id: i64 = sqlx::query_scalar(
            r#"
            INSERT INTO bookmarks (book_id, content, position, cfi, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            RETURNING id
            "#,
        )
        .bind(book_id)
        .bind(content)
        .bind(position)
        .bind(cfi)
        .fetch_one(&self.pool)
        .await?;

        let annotation = sqlx::query_as::<_, Annotation>(
            r#"
            SELECT id, book_id, content, position, cfi, created_at
            FROM bookmarks
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(annotation)
    }

    pub async fn delete(&self, id: i64) -> Result<()> {
        sqlx::query("DELETE FROM bookmarks WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn find_by_cfi(&self, book_id: i64, cfi: &str) -> Result<Vec<Annotation>> {
        let annotations = sqlx::query_as::<_, Annotation>(
            r#"
            SELECT id, book_id, content, position, cfi, created_at
            FROM bookmarks
            WHERE book_id = ? AND cfi = ?
            ORDER BY created_at DESC
            "#,
        )
        .bind(book_id)
        .bind(cfi)
        .fetch_all(&self.pool)
        .await?;
        Ok(annotations)
    }

    pub async fn update_content(&self, id: i64, content: &str) -> Result<Annotation> {
        sqlx::query("UPDATE bookmarks SET content = ? WHERE id = ?")
            .bind(content)
            .bind(id)
            .execute(&self.pool)
            .await?;

        let annotation = sqlx::query_as::<_, Annotation>(
            r#"
            SELECT id, book_id, content, position, cfi, created_at
            FROM bookmarks
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(annotation)
    }
}
