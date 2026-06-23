// 阅读统计实体类型定义
export interface ReadingStatistics {
  id: number;
  bookId: number;
  readingTime: number;
  date: string;
  pagesRead: number;
}

export interface DailyStatistics {
  date: string;
  totalTime: number;
  pagesRead: number;
  booksRead: number;
}

export interface BookStatistics {
  bookId: number;
  bookTitle: string;
  totalTime: number;
  totalPages: number;
  currentPage: number;
}
