import type { ReactNode } from 'react';
import type { Severity } from '../lib/types';

const SEV_STYLES: Record<Severity, { label: string; cls: string }> = {
  CRITICAL: { label: 'Crítica', cls: 'bg-rose-500/15 text-rose-300 ring-rose-500/30' },
  HIGH: { label: 'Alta', cls: 'bg-orange-500/15 text-orange-300 ring-orange-500/30' },
  MEDIUM: { label: 'Média', cls: 'bg-sky-500/15 text-sky-300 ring-sky-500/30' },
  LOW: { label: 'Baixa', cls: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
};

export function SeverityBadge({ severity }: { severity: Severity | null }) {
  if (!severity) {
    return (
      <span className="inline-flex items-center rounded-md bg-slate-500/15 px-2 py-0.5 text-xs font-medium text-slate-400 ring-1 ring-inset ring-slate-500/30">
        N/D
      </span>
    );
  }
  const s = SEV_STYLES[severity];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

export function Tag({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-300 ring-1 ring-inset ring-white/10"
    >
      {children}
    </span>
  );
}

export function KevBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-300 ring-1 ring-inset ring-rose-500/30">
      <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-rose-400" />
      KEV
    </span>
  );
}

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <div className="panel flex flex-col gap-1 p-4">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
      <span className={`font-display text-2xl font-semibold ${accent ?? 'text-slate-100'}`}>
        {value}
      </span>
    </div>
  );
}
