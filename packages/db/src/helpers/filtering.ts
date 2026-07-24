export type SortOrder = 'asc' | 'desc';

export interface SortOptions<TField extends string = string> {
  sortBy?: TField;
  sortOrder?: SortOrder;
}

export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface NumericRangeFilter {
  min?: number;
  max?: number;
}

export function buildSortClause<TField extends string>(
  options?: SortOptions<TField>,
  defaultField: TField = 'createdAt' as TField
): Record<string, SortOrder> {
  const sortBy = options?.sortBy ?? defaultField;
  const sortOrder = options?.sortOrder ?? 'desc';
  return { [sortBy]: sortOrder };
}

export function buildDateFilter(range?: DateRangeFilter): Record<string, unknown> | undefined {
  if (!range?.startDate && !range?.endDate) return undefined;
  const filter: Record<string, unknown> = {};
  if (range.startDate) filter['gte'] = range.startDate;
  if (range.endDate) filter['lte'] = range.endDate;
  return filter;
}
