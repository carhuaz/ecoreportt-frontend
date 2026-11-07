export interface Paginacion<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
