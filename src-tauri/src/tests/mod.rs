#[cfg(test)]
mod tests {
    use crate::models::Book;
    use crate::repositories::{BookRepository, QueryRecordRepository, WordCacheRepository};
    use crate::services::{BookService, TranslationService, StatisticsService};
    use crate::dto::{CreateBookRequest, TranslationRequest};
    use sqlx::SqlitePool;
    use sqlx::sqlite::SqlitePoolOptions;

    /// Create an in-memory SQLite database for testing
    async fn create_test_db() -> SqlitePool {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("Failed to create test database");

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
        .await
        .expect("Failed to create books table");

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
        .await
        .expect("Failed to create query_records table");

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
        .await
        .expect("Failed to create word_cache table");

        pool
    }

    // ==================== Book Repository Tests ====================

    #[tokio::test]
    async fn test_book_repository_create() {
        let pool = create_test_db().await;
        let repo = BookRepository::new(pool);

        let book = repo.create(
            "Test Book",
            "epub",
            "/path/to/test.epub",
            Some("Test Author"),
            Some(1024)
        ).await.expect("Failed to create book");

        assert_eq!(book.title, "Test Book");
        assert_eq!(book.format, "epub");
        assert_eq!(book.path, "/path/to/test.epub");
        assert_eq!(book.author, Some("Test Author".to_string()));
        assert_eq!(book.file_size, Some(1024));
    }

    #[tokio::test]
    async fn test_book_repository_find_all() {
        let pool = create_test_db().await;
        let repo = BookRepository::new(pool);

        // Create multiple books
        repo.create("Book 1", "epub", "/path1", None, None).await.unwrap();
        repo.create("Book 2", "pdf", "/path2", None, None).await.unwrap();
        repo.create("Book 3", "epub", "/path3", None, None).await.unwrap();

        let books = repo.find_all().await.expect("Failed to find all books");

        assert_eq!(books.len(), 3);
        // Books should be returned (order depends on SQLite datetime handling)
        assert!(books.iter().any(|b| b.title == "Book 1"));
        assert!(books.iter().any(|b| b.title == "Book 2"));
        assert!(books.iter().any(|b| b.title == "Book 3"));
    }

    #[tokio::test]
    async fn test_book_repository_find_by_id() {
        let pool = create_test_db().await;
        let repo = BookRepository::new(pool);

        let created = repo.create("Find Me", "pdf", "/find/path", None, None)
            .await.expect("Failed to create book");

        let found = repo.find_by_id(created.id)
            .await.expect("Failed to find book")
            .expect("Book not found");

        assert_eq!(found.id, created.id);
        assert_eq!(found.title, "Find Me");

        // Test not found case
        let not_found = repo.find_by_id(999).await.expect("Query failed");
        assert!(not_found.is_none());
    }

    #[tokio::test]
    async fn test_book_repository_delete() {
        let pool = create_test_db().await;
        let repo = BookRepository::new(pool);

        let book = repo.create("Delete Me", "epub", "/delete/path", None, None)
            .await.expect("Failed to create book");

        repo.delete(book.id).await.expect("Failed to delete book");

        let found = repo.find_by_id(book.id).await.expect("Query failed");
        assert!(found.is_none());
    }

    #[tokio::test]
    async fn test_book_repository_search() {
        let pool = create_test_db().await;
        let repo = BookRepository::new(pool);

        repo.create("Python Programming", "pdf", "/path1", None, None).await.unwrap();
        repo.create("JavaScript Guide", "epub", "/path2", None, None).await.unwrap();
        repo.create("Python Cookbook", "pdf", "/path3", None, None).await.unwrap();

        let results = repo.search("Python").await.expect("Search failed");

        assert_eq!(results.len(), 2);
        assert!(results.iter().any(|b| b.title == "Python Programming"));
        assert!(results.iter().any(|b| b.title == "Python Cookbook"));
    }

    // ==================== Book Service Tests ====================

    #[tokio::test]
    async fn test_book_service_create_and_get() {
        let pool = create_test_db().await;
        let service = BookService::new(pool);

        let created = service.create_book(
            "Service Book",
            "epub",
            "/service/path",
            Some("Service Author"),
            Some(2048)
        ).await.expect("Failed to create book");

        let found = service.get_book_by_id(created.id)
            .await.expect("Failed to get book")
            .expect("Book not found");

        assert_eq!(found.title, "Service Book");
        assert_eq!(found.format, "epub");
    }

    #[tokio::test]
    async fn test_book_service_get_all_books() {
        let pool = create_test_db().await;
        let service = BookService::new(pool);

        service.create_book("Book A", "pdf", "/a", None, None).await.unwrap();
        service.create_book("Book B", "epub", "/b", None, None).await.unwrap();

        let books = service.get_all_books().await.expect("Failed to get books");

        assert_eq!(books.len(), 2);
    }

    // ==================== Query Record Repository Tests ====================

    #[tokio::test]
    async fn test_query_record_repository_create() {
        let pool = create_test_db().await;
        let repo = QueryRecordRepository::new(pool);

        repo.create(
            "hello",
            "en",
            "zh-CHS",
            None,
            Some("Hello, world!"),
            "word"
        ).await.expect("Failed to create query record");

        // Verify it was created
        let summary = repo.get_summary().await.expect("Failed to get summary");
        assert_eq!(summary.0, 1); // total = 1
        assert_eq!(summary.1, 1); // unique = 1
    }

    #[tokio::test]
    async fn test_query_record_repository_vocabulary_list() {
        let pool = create_test_db().await;
        let repo = QueryRecordRepository::new(pool);

        // Create multiple query records
        repo.create("hello", "en", "zh", None, None, "word").await.unwrap();
        repo.create("world", "en", "zh", None, None, "word").await.unwrap();
        repo.create("hello", "en", "zh", None, None, "word").await.unwrap();

        let vocab = repo.get_vocabulary_list().await.expect("Failed to get vocabulary");

        assert_eq!(vocab.len(), 2); // 2 unique words
        // hello should have count 2
        let hello_entry = vocab.iter().find(|(w, _, _)| w == "hello");
        assert!(hello_entry.is_some());
        assert_eq!(hello_entry.unwrap().1, 2);
    }

    #[tokio::test]
    async fn test_query_record_repository_summary() {
        let pool = create_test_db().await;
        let repo = QueryRecordRepository::new(pool);

        repo.create("test", "en", "zh", None, None, "word").await.unwrap();
        repo.create("test", "en", "zh", None, None, "word").await.unwrap();
        repo.create("example", "en", "zh", None, None, "word").await.unwrap();

        let (total, unique, most_looked_up, avg) = repo.get_summary()
            .await.expect("Failed to get summary");

        assert_eq!(total, 3);
        assert_eq!(unique, 2);
        assert_eq!(most_looked_up, Some("test".to_string()));
        assert_eq!(avg, 1.5); // 3 total / 2 unique = 1.5
    }

    // ==================== Word Cache Repository Tests ====================

    #[tokio::test]
    async fn test_word_cache_repository_create_and_find() {
        let pool = create_test_db().await;
        let repo = WordCacheRepository::new(pool);

        repo.create(
            "hello",
            "en",
            "zh-CHS",
            "你好",
            Some("həˈləʊ"),
            Some("[\"问候语\"]")
        ).await.expect("Failed to create cache");

        let found = repo.find_by_word("hello", "en", "zh-CHS")
            .await.expect("Failed to find cache")
            .expect("Cache not found");

        assert_eq!(found.word, "hello");
        assert_eq!(found.translated, "你好");
        assert_eq!(found.phonetic, Some("həˈləʊ".to_string()));
    }

    #[tokio::test]
    async fn test_word_cache_repository_upsert() {
        let pool = create_test_db().await;
        let repo = WordCacheRepository::new(pool);

        // Insert first
        repo.create("test", "en", "zh", "测试1", None, None).await.unwrap();

        // Upsert (update)
        repo.create("test", "en", "zh", "测试2", Some("new phonetic"), None).await.unwrap();

        let found = repo.find_by_word("test", "en", "zh")
            .await.expect("Query failed")
            .expect("Cache not found");

        // Should have updated value
        assert_eq!(found.translated, "测试2");
        assert_eq!(found.phonetic, Some("new phonetic".to_string()));
    }

    // ==================== Translation Service Tests ====================

    #[tokio::test]
    async fn test_translation_service_translate() {
        let pool = create_test_db().await;
        let service = TranslationService::new(pool);

        let request = TranslationRequest {
            text: "hello".to_string(),
            from: Some("en".to_string()),
            to: Some("zh-CHS".to_string()),
            book_id: None,
            context: Some("Hello, world!".to_string()),
        };

        let result = service.translate(request).await.expect("Translation failed");

        assert!(result.success);
        assert_eq!(result.original_text, "hello");
        // Mock translation returns "[Translated] hello"
        assert!(result.api_result.is_some());
    }

    // ==================== Statistics Service Tests ====================

    #[tokio::test]
    async fn test_statistics_service_vocabulary_list() {
        let pool = create_test_db().await;
        let query_repo = QueryRecordRepository::new(pool.clone());
        let service = StatisticsService::new(pool);

        // Create query records
        query_repo.create("word1", "en", "zh", None, None, "word").await.unwrap();
        query_repo.create("word2", "en", "zh", None, None, "word").await.unwrap();

        let vocab = service.get_vocabulary_list().await.expect("Failed to get vocabulary");

        assert_eq!(vocab.len(), 2);
    }

    #[tokio::test]
    async fn test_statistics_service_summary() {
        let pool = create_test_db().await;
        let query_repo = QueryRecordRepository::new(pool.clone());
        let service = StatisticsService::new(pool);

        // Create query records
        query_repo.create("test", "en", "zh", None, None, "word").await.unwrap();
        query_repo.create("test", "en", "zh", None, None, "word").await.unwrap();

        let summary = service.get_statistics_summary().await.expect("Failed to get summary");

        assert_eq!(summary.total_lookups, 2);
        assert_eq!(summary.unique_words, 1);
        assert_eq!(summary.most_looked_up_word, "test");
    }
}