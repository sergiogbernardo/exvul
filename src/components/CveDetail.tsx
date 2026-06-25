import { useEffect } from 'react';
import type { Cve } from '../lib/types';
import { SeverityBadge, Tag, KevBadge } from './ui';

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function CveDetail({
  cve,
  cweNames,
  onClose,
}: {
  cve: Cve;
  cweNames: Record<string, string>;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${cve.id}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-lg font-semibold text-emerald-300">{cve.id}</h2>
            <SeverityBadge severity={cve.severity} />
            {cve.cvssScore != null && <Tag>CVSS {cve.cvssScore.toFixed(1)}</Tag>}
            {cve.kev && <KevBadge />}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-100"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
              <path d="M6 6l12 12M18 6 6 18" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-300">{cve.description}</p>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <Field label="Publicada" value={formatDate(cve.published)} />
          <Field label="Modificada" value={formatDate(cve.lastModified)} />
          {cve.kev && <Field label="Adicionada ao KEV" value={formatDate(cve.kevDate)} />}
          {cve.vendor && <Field label="Fornecedor" value={cve.vendor} />}
          {cve.product && <Field label="Produto" value={cve.product} />}
          {cve.ransomware && <Field label="Ransomware" value="Uso conhecido" />}
        </dl>

        {cve.weaknesses.length > 0 && (
          <section className="mt-5">
            <h3 className="panel-title mb-2">Fraquezas (CWE)</h3>
            <ul className="flex flex-col gap-1.5">
              {cve.weaknesses.map((cwe) => (
                <li key={cwe} className="flex items-baseline gap-2 text-sm">
                  <Tag>{cwe}</Tag>
                  <span className="text-slate-300">{cweNames[cwe] ?? '—'}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {cve.refLinks.length > 0 && (
          <section className="mt-5">
            <h3 className="panel-title mb-2">Referências</h3>
            <ul className="flex flex-col gap-1">
              {cve.refLinks.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="break-all text-sm text-emerald-300/90 underline-offset-2 hover:underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <a
          href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/15 px-3 py-2 text-sm font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/30 transition hover:bg-emerald-400/25"
        >
          Ver no NVD
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
            <path d="M7 17 17 7M9 7h8v8" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </a>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-slate-200">{value}</dd>
    </div>
  );
}
