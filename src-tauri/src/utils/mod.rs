/// Utility functions

/// Generate UUID
pub fn generate_uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}

/// Generate unique filename
pub fn generate_unique_filename(original: &str) -> String {
    let uuid = generate_uuid();
    format!("{}_{}", original, uuid)
}

/// Get file extension
pub fn get_file_extension(filename: &str) -> Option<&str> {
    filename.rfind('.').map(|i| &filename[i + 1..])
}

/// Check if file is PDF
pub fn is_pdf(filename: &str) -> bool {
    get_file_extension(filename)
        .map(|ext| ext.eq_ignore_ascii_case("pdf"))
        .unwrap_or(false)
}

/// Check if file is EPUB
pub fn is_epub(filename: &str) -> bool {
    get_file_extension(filename)
        .map(|ext| ext.eq_ignore_ascii_case("epub"))
        .unwrap_or(false)
}
