import { DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QueryParams } from './admin.models';

/**
 * List state (filters + page + page size + sort) mirrored in the URL query string,
 * so "back" restores the view and filtered lists can be shared as links.
 *
 *   state = adminListState({ search: '', status: '' }, () => this.load());
 *   state.filters.search ... state.page() ... state.query()
 */
export function adminListState<F extends Record<string, string>>(
  defaults: F,
  onChange: () => void,
  opts: { pageSize?: number; sort?: string; order?: 'asc' | 'desc' } = {},
) {
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const destroyRef = inject(DestroyRef);
  const qp = route.snapshot.queryParamMap;

  const filters = { ...defaults } as F;
  for (const key of Object.keys(defaults)) {
    const v = qp.get(key);
    if (v !== null) (filters as Record<string, string>)[key] = v;
  }

  const page = signal(Number(qp.get('page')) || 1);
  const pageSize = signal(Number(qp.get('page_size')) || opts.pageSize || 20);
  const sort = signal(qp.get('sort') || opts.sort || '');
  const order = signal<'asc' | 'desc'>((qp.get('order') as 'asc' | 'desc') || opts.order || 'desc');
  const total = signal(0);
  const totalPages = signal(0);

  const typed = new Subject<void>();
  typed.pipe(debounceTime(350), takeUntilDestroyed(destroyRef)).subscribe(() => apply());

  function sync(): void {
    const queryParams: Record<string, string | number | null> = {};
    for (const [k, v] of Object.entries(filters)) queryParams[k] = v && v !== defaults[k] ? v : null;
    queryParams['page'] = page() > 1 ? page() : null;
    queryParams['page_size'] = pageSize() !== (opts.pageSize || 20) ? pageSize() : null;
    queryParams['sort'] = sort() && sort() !== (opts.sort || '') ? sort() : null;
    queryParams['order'] = order() !== (opts.order || 'desc') ? order() : null;
    router.navigate([], { relativeTo: route, queryParams, queryParamsHandling: 'merge', replaceUrl: true });
  }

  /** Filters changed → back to page 1 */
  function apply(): void {
    page.set(1);
    sync();
    onChange();
  }

  return {
    filters,
    page, pageSize, sort, order, total, totalPages,
    /** Call from (input) on free-text fields: debounced apply */
    typed: () => typed.next(),
    apply,
    reset(): void {
      Object.assign(filters, defaults);
      apply();
    },
    goTo(p: number): void {
      page.set(p);
      sync();
      onChange();
    },
    setPageSize(size: number): void {
      pageSize.set(size);
      apply();
    },
    sortBy(field: string): void {
      if (sort() === field) order.set(order() === 'asc' ? 'desc' : 'asc');
      else { sort.set(field); order.set('desc'); }
      apply();
    },
    sortIcon(field: string): string {
      return sort() === field ? (order() === 'asc' ? ' ▲' : ' ▼') : '';
    },
    /** Query object for AdminApiService (empty values are dropped by the service). */
    query(extra: QueryParams = {}): QueryParams {
      return {
        ...filters, page: page(), page_size: pageSize(),
        ...(sort() ? { sort: sort(), order: order() } : {}),
        ...extra,
      };
    },
    /** Store pagination metadata from a Page<T> response */
    setPage(res: { total: number; total_pages: number; page: number }): void {
      total.set(res.total);
      totalPages.set(res.total_pages);
      if (res.page > res.total_pages && res.total_pages > 0) this.goTo(res.total_pages);
    },
  };
}

export type AdminListState = ReturnType<typeof adminListState>;
