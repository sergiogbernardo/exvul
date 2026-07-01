# EV — Exposições & Vulnerabilidades

Browse recent high/critical **CVEs** and CISA's **KEV** catalog (known
exploited vulnerabilities), each mapped to its **CWE** weaknesses — **entirely
in the browser**. There is no backend and nothing leaves your machine.

Part of the [project hub](https://sabion.io/), alongside
[Threatvg](https://sabion.io/Threatvg/),
[Scanvg](https://sabion.io/Scanvg/) and
[Inspectorvg](https://sabion.io/Inspectorvg/).

## What it does

- **CVE list** — filter by severity, CWE and free text; flag KEV-only.
- **KEV** — CVEs CISA marks as actively exploited are surfaced first, with the
  date they were added and ransomware usage where known.
- **CWE** — every CVE shows its weaknesses with human-readable names.
- **Detail** — CVSS score, dates, affected vendor/product, references and a
  link to the full NVD record.

## Data pipeline

The app is static; the data is generated ahead of time and served as a plain,
cacheable JSON asset (`public/data/cves.json`) that the app fetches at runtime.

`scripts/build-data.mjs` pulls from two authoritative, public sources:

- **NVD CVE API 2.0** — recent `CRITICAL`/`HIGH` CVEs (last 90 days) with CVSS
  score, severity and CWE weaknesses.
- **CISA KEV catalog** — actively exploited vulnerabilities. It already carries
  CWEs, so it works as a zero-key baseline even when NVD is unavailable.

CWE ids are resolved to names via `scripts/cwe-dictionary.json`; only the names
actually used are embedded, keeping the payload lean.

```bash
npm run data            # regenerate public/data/cves.json
```

Tunable via environment variables:

| Variable         | Default         | Meaning                                |
| ---------------- | --------------- | -------------------------------------- |
| `NVD_API_KEY`    | —               | Higher NVD rate limit (50 vs 5 / 30s). |
| `EV_WINDOW_DAYS` | `90`            | How far back to pull NVD CVEs.         |
| `EV_SEVERITIES`  | `CRITICAL,HIGH` | NVD severities to include.             |
| `EV_MAX_CVES`    | `4000`          | Cap on total items in the dataset.     |

## Automation (GitHub Actions)

- **`update-data.yml`** — runs daily (cron), regenerates the dataset and commits
  it only when it changed. Add `NVD_API_KEY` as a repository secret to lift the
  rate limit (optional). The commit pushes to `main`, which triggers the deploy.
- **`deploy.yml`** — on every push to `main`: lint, test, build and publish to
  GitHub Pages.

## Stack

React + TypeScript + Vite + Tailwind. No backend, no tracking.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview
```

The Vite `base` is `/exvul/` to match GitHub Pages. Deployment is automated by
`.github/workflows/deploy.yml` on every push to `main`.

## Sources & license

Data © their respective owners — [NVD/NIST](https://nvd.nist.gov/) and
[CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog). This
project only reformats public feeds for browsing.
