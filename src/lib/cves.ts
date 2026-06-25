import type { Cve, Filters } from './types';

/**
 * Filters a CVE list by free-text search (id / description / vendor / product),
 * severity, CWE id and the KEV flag. Pure and order-preserving — the dataset is
 * already sorted by the data builder (KEV first, then severity, then recency).
 */
export function filterCves(items: Cve[], filters: Filters): Cve[] {
  const term = filters.search.trim().toLowerCase();

  return items.filter((cve) => {
    if (filters.kevOnly && !cve.kev) return false;
    if (filters.severity && cve.severity !== filters.severity) return false;
    if (filters.cwe && !cve.weaknesses.includes(filters.cwe)) return false;

    if (term) {
      const haystack = [
        cve.id,
        cve.description,
        cve.vendor ?? '',
        cve.product ?? '',
        ...cve.weaknesses,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    return true;
  });
}

export interface Page<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
}

/** Returns a clamped slice of `items` for the requested 1-based page. */
export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const current = Math.min(Math.max(page, 1), totalPages);
  const start = (current - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: current,
    totalPages,
    total,
  };
}

/** Distinct CWE ids present in the dataset, sorted by frequency (desc). */
export function topCwes(items: Cve[]): string[] {
  const counts = new Map<string, number>();
  for (const cve of items) {
    for (const cwe of cve.weaknesses) {
      counts.set(cwe, (counts.get(cwe) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
