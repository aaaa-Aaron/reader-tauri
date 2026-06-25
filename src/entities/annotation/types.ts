export interface Annotation {
  id: number;
  bookId: number;
  content: string;
  position: string;
  cfi?: string;
  createdAt: string;
}

export interface CreateAnnotationRequest {
  bookId: number;
  content: string;
  position: string;
  cfi?: string;
}