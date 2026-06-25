export function TopBar({ generatedAt, source }: { generatedAt: string; source: string }) {
  const stamp = new Date(generatedAt);
  const formatted = isNaN(stamp.getTime())
    ? '—'
    : stamp.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <header className="sticky top-0 z-20 border-b border-emerald-500/15 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
              <path
                d="M12 3 19 6v6c0 4.4-3 7-7 8.5C8 19 5 16.4 5 12V6Z"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path d="m9 12 2 2.2 4-4.4" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <div className="leading-tight">
            <h1 className="font-display text-base font-semibold text-slate-100">EV</h1>
            <p className="text-[11px] text-slate-400">Exposições &amp; Vulnerabilidades</p>
          </div>
        </div>
        <div className="hidden text-right text-[11px] text-slate-500 sm:block">
          <p>{source}</p>
          <p>
            Atualizado em <span className="text-slate-300">{formatted}</span>
          </p>
        </div>
      </div>
    </header>
  );
}
