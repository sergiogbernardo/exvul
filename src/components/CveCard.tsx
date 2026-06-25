import type { Cve } from '../lib/types';
import { SeverityBadge, Tag, KevBadge } from './ui';

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function CveCard({
  cve,
  cweNames,
  onSelect,
}: {
  cve: Cve;
  cweNames: Record<string, string>;
  onSelect: (cve: Cve) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(cve)}
      className="panel w-full p-4 text-left transition hover:border-emerald-400/40 hover:bg-emerald-400/5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold text-emerald-300">{cve.id}</span>
        <SeverityBadge severity={cve.severity} />
        {cve.cvssScore != null && (
          <Tag title="CVSS base score">CVSS {cve.cvssScore.toFixed(1)}</Tag>
        )}
        {cve.kev && <KevBadge />}
        {cve.ransomware && (
          <Tag title="Usada em campanhas de ransomware conhecidas">Ransomware</Tag>
        )}
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-slate-300">{cve.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {cve.weaknesses.slice(0, 3).map((cwe) => (
          <Tag key={cwe} title={cweNames[cwe] ?? cwe}>
            {cwe}
          </Tag>
        ))}
        {cve.weaknesses.length > 3 && (
          <span className="text-xs text-slate-500">+{cve.weaknesses.length - 3}</span>
        )}
        <span className="ml-auto text-xs text-slate-500">{formatDate(cve.published)}</span>
      </div>
    </button>
  );
}
