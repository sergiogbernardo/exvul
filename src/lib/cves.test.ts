import { describe, it, expect } from 'vitest';
import { filterCves, paginate, topCwes } from './cves';
import type { Cve } from './types';

function makeCve(over: Partial<Cve>): Cve {
  return {
    id: 'CVE-2024-0001',
    published: '2024-01-01T00:00:00.000',
    lastModified: null,
    severity: 'HIGH',
    cvssScore: 7.5,
    description: 'A sample vulnerability',
    weaknesses: [],
    refLinks: [],
    kev: false,
    kevDate: null,
    ...over,
  };
}

const items: Cve[] = [
  makeCve({ id: 'CVE-2024-1000', severity: 'CRITICAL', kev: true, weaknesses: ['CWE-79'] }),
  makeCve({ id: 'CVE-2024-2000', severity: 'HIGH', description: 'SQL injection in login' }),
  makeCve({ id: 'CVE-2024-3000', severity: 'MEDIUM', vendor: 'Acme', weaknesses: ['CWE-89'] }),
];

describe('filterCves', () => {
  it('returns everything with empty filters', () => {
    const out = filterCves(items, { search: '', severity: '', cwe: '', kevOnly: false });
    expect(out).toHaveLength(3);
  });

  it('filters by KEV only', () => {
    const out = filterCves(items, { search: '', severity: '', cwe: '', kevOnly: true });
    expect(out.map((c) => c.id)).toEqual(['CVE-2024-1000']);
  });

  it('filters by severity', () => {
    const out = filterCves(items, { search: '', severity: 'HIGH', cwe: '', kevOnly: false });
    expect(out.map((c) => c.id)).toEqual(['CVE-2024-2000']);
  });

  it('filters by CWE id', () => {
    const out = filterCves(items, { search: '', severity: '', cwe: 'CWE-89', kevOnly: false });
    expect(out.map((c) => c.id)).toEqual(['CVE-2024-3000']);
  });

  it('searches id, description and vendor case-insensitively', () => {
    expect(
      filterCves(items, { search: 'sql', severity: '', cwe: '', kevOnly: false }),
    ).toHaveLength(1);
    expect(
      filterCves(items, { search: 'acme', severity: '', cwe: '', kevOnly: false }),
    ).toHaveLength(1);
    expect(
      filterCves(items, { search: '3000', severity: '', cwe: '', kevOnly: false }),
    ).toHaveLength(1);
  });
});

describe('paginate', () => {
  it('slices and clamps the page', () => {
    const p = paginate(items, 1, 2);
    expect(p.items).toHaveLength(2);
    expect(p.totalPages).toBe(2);
    expect(p.total).toBe(3);
  });

  it('clamps out-of-range pages to the last page', () => {
    const p = paginate(items, 99, 2);
    expect(p.page).toBe(2);
    expect(p.items.map((c) => c.id)).toEqual(['CVE-2024-3000']);
  });
});

describe('topCwes', () => {
  it('lists distinct CWE ids present', () => {
    expect(topCwes(items).sort()).toEqual(['CWE-79', 'CWE-89']);
  });
});
