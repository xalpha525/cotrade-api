export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export function calculateOffset(page = 1, pageSize = 20): { take: number; skip: number } {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const skip = (safePage - 1) * safePageSize;
  return { take: safePageSize, skip };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page = 1,
  pageSize = 20
): PaginatedResult<T> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const totalPages = Math.ceil(total / safePageSize);

  return {
    data,
    meta: {
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1
    }
  };
}

export function buildCursorPaginatedResult<T extends { id: string }>(
  data: T[],
  limit = 20
): CursorPaginatedResult<T> {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? lastItem.id : null;

  return {
    data: items,
    meta: {
      nextCursor,
      hasMore
    }
  };
}
