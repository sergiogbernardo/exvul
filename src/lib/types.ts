export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Cve {
  id: string;
  published: string | null;
  lastModified: string | null;
  severity: Severity | null;
  cvssScore: number | null;
  description: string;
  weaknesses: string[];
  refLinks: string[];
  kev: boolean;
  kevDate: string | null;
  ransomware?: boolean;
  vendor?: string | null;
  product?: string | null;
}

export interface Dataset {
  meta: {
    generatedAt: string;
    source: string;
    windowDays: number;
    severities: string[];
    total: number;
    kevCount: number;
    severityCounts: Record<string, number>;
  };
  cweNames: Record<string, string>;
  items: Cve[];
}

export interface Filters {
  search: string;
  severity: Severity | '';
  cwe: string;
  kevOnly: boolean;
}
