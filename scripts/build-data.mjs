// Builds the static dataset the app consumes (src/data/cves.json) from two
// public, authoritative sources:
//
//   1. NVD CVE API 2.0   — recent CRITICAL/HIGH CVEs (last N days), with CVSS
//                          score, severity and CWE weaknesses.
//   2. CISA KEV catalog  — vulnerabilities known to be actively exploited.
//                          Already carries CWEs, vendor/product and the date
//                          it was added, so it works as a zero-key baseline
//                          even if NVD is unavailable.
//
// CWE ids are resolved to human-readable names using scripts/cwe-dictionary.json
// and only the names actually used are embedded in the output, keeping the
// bundle small.
//
// Run with: npm run data
//
// Env:
//   NVD_API_KEY   optional — higher NVD rate limit (50 vs 5 req / 30s).
//   EV_WINDOW_DAYS    default 90  — how far back to pull NVD CVEs.
//   EV_SEVERITIES     default "CRITICAL,HIGH" — NVD severities to include.
//   EV_MAX_CVES       default 1200 — cap on total items in the dataset.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');

const WINDOW_DAYS = Number(process.env.EV_WINDOW_DAYS) || 90;
const SEVERITIES = (process.env.EV_SEVERITIES || 'CRITICAL,HIGH')
  .split(',')
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);
const MAX_CVES = Number(process.env.EV_MAX_CVES) || 4000;

const NVD_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const KEV_URL =
  'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

const cweDict = JSON.parse(readFileSync(join(here, 'cwe-dictionary.json'), 'utf8'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, { timeout = 30000, attempts = 3 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      if (i === attempts - 1) throw err;
      await sleep(1500 * (i + 1));
    }
  }
}

// --- CISA KEV ----------------------------------------------------------------
async function fetchKev() {
  const data = await fetchJson(KEV_URL);
  const entries = data.vulnerabilities ?? [];
  const map = new Map();
  for (const e of entries) {
    map.set(e.cveID, {
      id: e.cveID,
      description: (e.shortDescription || '').trim(),
      weaknesses: Array.isArray(e.cwes) ? e.cwes.filter(Boolean) : [],
      kevDate: e.dateAdded || null,
      vendor: e.vendorProject || null,
      product: e.product || null,
      ransomware:
        typeof e.knownRansomwareCampaignUse === 'string' &&
        e.knownRansomwareCampaignUse.toLowerCase() === 'known',
    });
  }
  return map;
}

// --- NVD ----------------------------------------------------------------------
function isoDaysAgo(days) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().split('.')[0] + '.000';
}

function pickMetric(metrics) {
  const order = ['cvssMetricV31', 'cvssMetricV30', 'cvssMetricV2'];
  for (const key of order) {
    const arr = metrics?.[key];
    if (Array.isArray(arr) && arr.length) {
      const primary = arr.find((m) => m.type === 'Primary') ?? arr[0];
      const score = primary?.cvssData?.baseScore ?? null;
      const sev = (primary?.baseSeverity || primary?.cvssData?.baseSeverity || '').toUpperCase();
      return { score, severity: sev || null };
    }
  }
  return { score: null, severity: null };
}

function extractWeaknesses(weaknesses) {
  const out = new Set();
  for (const w of weaknesses ?? []) {
    for (const d of w.description ?? []) {
      if (d.lang === 'en' && d.value && d.value.startsWith('CWE-')) out.add(d.value);
    }
  }
  return [...out];
}

function normalizeNvd(item) {
  const cve = item.cve;
  const enDesc = (cve.descriptions ?? []).find((d) => d.lang === 'en');
  const { score, severity } = pickMetric(cve.metrics);
  const refs = (cve.references ?? []).slice(0, 4).map((r) => r.url);
  return {
    id: cve.id,
    published: cve.published || null,
    lastModified: cve.lastModified || null,
    severity,
    cvssScore: score,
    description: (enDesc?.value || '').trim(),
    weaknesses: extractWeaknesses(cve.weaknesses),
    refLinks: refs,
  };
}

async function fetchNvdRecent() {
  const apiKey = process.env.NVD_API_KEY;
  const perReqDelay = apiKey ? 700 : 6500; // respect NVD rate limits
  const pubStart = isoDaysAgo(WINDOW_DAYS);
  const pubEnd = isoDaysAgo(0);
  const items = [];

  for (const sev of SEVERITIES) {
    let startIndex = 0;
    let totalResults = Infinity;
    while (startIndex < totalResults && items.length < MAX_CVES) {
      const q = new URLSearchParams({
        pubStartDate: pubStart,
        pubEndDate: pubEnd,
        cvssV3Severity: sev,
        resultsPerPage: '2000',
        startIndex: String(startIndex),
      });
      if (apiKey) q.append('apiKey', apiKey);
      const data = await fetchJson(`${NVD_URL}?${q.toString()}`);
      totalResults = data.totalResults ?? 0;
      for (const v of data.vulnerabilities ?? []) items.push(normalizeNvd(v));
      startIndex += data.resultsPerPage || 2000;
      console.log(
        `  NVD ${sev}: ${Math.min(startIndex, totalResults)}/${totalResults} (kept ${items.length})`,
      );
      if (startIndex < totalResults) await sleep(perReqDelay);
    }
  }
  return items;
}

// --- Merge & write ------------------------------------------------------------
const SEV_RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function merge(nvdItems, kevMap) {
  const byId = new Map();

  for (const item of nvdItems) {
    byId.set(item.id, { ...item, kev: false, kevDate: null });
  }

  for (const [id, kev] of kevMap) {
    const existing = byId.get(id);
    if (existing) {
      existing.kev = true;
      existing.kevDate = kev.kevDate;
      existing.ransomware = kev.ransomware;
      if (!existing.weaknesses.length) existing.weaknesses = kev.weaknesses;
      if (!existing.description) existing.description = kev.description;
      existing.vendor = kev.vendor;
      existing.product = kev.product;
    } else {
      byId.set(id, {
        id: kev.id,
        published: kev.kevDate ? `${kev.kevDate}T00:00:00.000` : null,
        lastModified: null,
        severity: null,
        cvssScore: null,
        description: kev.description,
        weaknesses: kev.weaknesses,
        refLinks: [`https://nvd.nist.gov/vuln/detail/${kev.id}`],
        kev: true,
        kevDate: kev.kevDate,
        ransomware: kev.ransomware,
        vendor: kev.vendor,
        product: kev.product,
      });
    }
  }

  const items = [...byId.values()].sort((a, b) => {
    if (a.kev !== b.kev) return a.kev ? -1 : 1;
    const ra = SEV_RANK[a.severity] ?? 9;
    const rb = SEV_RANK[b.severity] ?? 9;
    if (ra !== rb) return ra - rb;
    return (b.published || '').localeCompare(a.published || '');
  });

  return items.slice(0, MAX_CVES);
}

function buildCweNames(items) {
  const used = new Set();
  for (const it of items) for (const w of it.weaknesses) used.add(w);
  const names = {};
  for (const id of used) names[id] = cweDict[id] || id;
  return names;
}

function severityCounts(items) {
  const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
  for (const it of items) c[it.severity ?? 'UNKNOWN'] = (c[it.severity ?? 'UNKNOWN'] || 0) + 1;
  return c;
}

async function main() {
  console.log('Fetching CISA KEV catalog…');
  const kevMap = await fetchKev();
  console.log(`  KEV entries: ${kevMap.size}`);

  let nvdItems = [];
  try {
    console.log(`Fetching NVD CVEs (${SEVERITIES.join(', ')}, last ${WINDOW_DAYS}d)…`);
    nvdItems = await fetchNvdRecent();
  } catch (err) {
    console.warn(`  NVD fetch failed (${err.message}); falling back to KEV-only dataset.`);
  }

  const items = merge(nvdItems, kevMap);
  const out = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: 'NVD CVE API 2.0 + CISA KEV',
      windowDays: WINDOW_DAYS,
      severities: SEVERITIES,
      total: items.length,
      kevCount: items.filter((i) => i.kev).length,
      severityCounts: severityCounts(items),
    },
    cweNames: buildCweNames(items),
    items,
  };

  // Written to public/ so Vite serves it as a standalone, cacheable asset that
  // the app fetches at runtime — keeps it out of the JS bundle.
  const dataDir = join(repo, 'public', 'data');
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, 'cves.json'), JSON.stringify(out) + '\n');
  console.log(
    `Wrote public/data/cves.json — ${items.length} items (${out.meta.kevCount} KEV), ` +
      `${Object.keys(out.cweNames).length} CWEs.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
