import type { Filters, Severity } from '../lib/types';

const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const SEV_LABEL: Record<Severity, string> = {
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
};

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  cweOptions: string[];
  cweNames: Record<string, string>;
  resultCount: number;
}

export function FiltersBar({ filters, onChange, cweOptions, cweNames, resultCount }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const inputCls =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30';

  return (
    <div className="panel flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-medium text-slate-400">Buscar</span>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="CVE-ID, descrição, fornecedor, CWE…"
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400">Severidade</span>
          <select
            value={filters.severity}
            onChange={(e) => set({ severity: e.target.value as Severity | '' })}
            className={inputCls}
          >
            <option value="">Todas</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {SEV_LABEL[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400">Fraqueza (CWE)</span>
          <select
            value={filters.cwe}
            onChange={(e) => set({ cwe: e.target.value })}
            className={inputCls}
          >
            <option value="">Todas</option>
            {cweOptions.map((id) => (
              <option key={id} value={id}>
                {id} — {cweNames[id] ?? id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={filters.kevOnly}
            onChange={(e) => set({ kevOnly: e.target.checked })}
            className="h-4 w-4 accent-emerald-400"
          />
          Apenas exploradas ativamente (KEV)
        </label>
        <span className="text-xs text-slate-500">
          {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>
    </div>
  );
}
