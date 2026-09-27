import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { readNumberParam } from '@/utils/searchParams';

export function useListParams() {
  const [params, setParams] = useSearchParams();
  const page = readNumberParam(params.get('page'), 1);
  const search = params.get('search') ?? '';
  const [draft, setDraft] = useState(search);

  const update = useCallback((next: Record<string, string | number | undefined>) => {
    const copy = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '') copy.delete(key);
      else copy.set(key, String(value));
    });
    setParams(copy);
  }, [params, setParams]);

  return useMemo(
    () => ({
      page,
      search,
      draft,
      setDraft,
      status: params.get('status') ?? undefined,
      role: params.get('role') ?? undefined,
      bloodGroup: params.get('bloodGroup') ?? undefined,
      urgency: params.get('urgency') ?? undefined,
      city: params.get('city') ?? undefined,
      update,
      commitSearch: () => update({ search: draft, page: 1 }),
    }),
    [page, search, draft, params, update],
  );
}
