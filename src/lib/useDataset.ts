import { useEffect, useState } from 'react';
import type { Dataset } from './types';

type State =
  | { status: 'loading' }
  | { status: 'ready'; dataset: Dataset }
  | { status: 'error'; message: string };

/**
 * Loads the static dataset served from public/data/cves.json. It lives outside
 * the JS bundle so the browser can cache it independently and the app shell
 * stays small.
 */
export function useDataset(): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const url = `${import.meta.env.BASE_URL}data/cves.json`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Dataset>;
      })
      .then((dataset) => setState({ status: 'ready', dataset }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: err instanceof Error ? err.message : 'erro' });
      });

    return () => controller.abort();
  }, []);

  return state;
}
