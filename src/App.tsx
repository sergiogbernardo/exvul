import { useMemo, useState, type ReactNode } from 'react';
import type { Cve, Dataset, Filters } from './lib/types';
import { filterCves, paginate, topCwes } from './lib/cves';
import { useDataset } from './lib/useDataset';
import { TopBar } from './components/TopBar';
import { FiltersBar } from './components/Filters';
import { CveCard } from './components/CveCard';
import { CveDetail } from './components/CveDetail';
import { StatCard } from './components/ui';

const PAGE_SIZE = 12;
const EMPTY_FILTERS: Filters = { search: '', severity: '', cwe: '', kevOnly: false };

export default function App() {
  const state = useDataset();

  if (state.status === 'loading') {
    return <Centered>Carregando vulnerabilidades…</Centered>;
  }
  if (state.status === 'error') {
    return (
      <Centered>
        Não foi possível carregar os dados ({state.message}). Tente recarregar a página.
      </Centered>
    );
  }
  return <Browser dataset={state.dataset} />;
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center text-sm text-slate-400">
      <p className="max-w-md">{children}</p>
    </div>
  );
}

function Browser({ dataset }: { dataset: Dataset }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Cve | null>(null);

  const cweOptions = useMemo(() => topCwes(dataset.items), [dataset]);
  const filtered = useMemo(() => filterCves(dataset.items, filters), [dataset, filters]);
  const pageData = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page]);

  const onFilters = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };

  const { severityCounts } = dataset.meta;

  return (
    <div className="min-h-screen">
      <TopBar generatedAt={dataset.meta.generatedAt} source={dataset.meta.source} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <section className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-slate-100 sm:text-3xl">
            Exposições &amp; Vulnerabilidades
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            CVEs recentes de severidade alta/crítica e o catálogo KEV da CISA (exploração ativa),
            com suas fraquezas CWE. Dados gerados periodicamente e servidos estáticos — tudo roda no
            navegador.
          </p>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total" value={dataset.meta.total} accent="text-emerald-300" />
          <StatCard label="KEV" value={dataset.meta.kevCount} accent="text-rose-300" />
          <StatCard label="Críticas" value={severityCounts.CRITICAL ?? 0} accent="text-rose-300" />
          <StatCard label="Altas" value={severityCounts.HIGH ?? 0} accent="text-orange-300" />
          <StatCard label="CWEs" value={cweOptions.length} accent="text-sky-300" />
        </section>

        <div className="mb-6">
          <FiltersBar
            filters={filters}
            onChange={onFilters}
            cweOptions={cweOptions}
            cweNames={dataset.cweNames}
            resultCount={filtered.length}
          />
        </div>

        {pageData.items.length === 0 ? (
          <p className="panel py-12 text-center text-sm text-slate-400">
            Nenhuma vulnerabilidade encontrada com esses filtros.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {pageData.items.map((cve) => (
              <CveCard key={cve.id} cve={cve} cweNames={dataset.cweNames} onSelect={setSelected} />
            ))}
          </div>
        )}

        {pageData.totalPages > 1 && (
          <nav className="mt-6 flex items-center justify-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={pageData.page <= 1}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-slate-300 transition enabled:hover:border-emerald-400/40 enabled:hover:text-emerald-300 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-slate-400">
              Página {pageData.page} de {pageData.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={pageData.page >= pageData.totalPages}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-slate-300 transition enabled:hover:border-emerald-400/40 enabled:hover:text-emerald-300 disabled:opacity-40"
            >
              Próxima
            </button>
          </nav>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-600">
        Fontes: NVD/NIST e CISA KEV. EV não armazena nem envia nada — todo o processamento acontece
        no seu navegador.
      </footer>

      {selected && (
        <CveDetail cve={selected} cweNames={dataset.cweNames} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
