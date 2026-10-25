import type { DietId, PeriodId, Specimen } from './catalog.ts';

export type OverviewState = Readonly<{
  specimen: string | null;
  view: 'results' | 'spotlight';
  index: number;
  query: string;
  diet: DietId | null;
  period: PeriodId | null;
  sort: 'name-asc' | 'name-desc';
  page: number;
}>;

export const defaultOverviewState: OverviewState = {
  specimen: 'ankylosaurus', view: 'results', index: 0,
  query: '', diet: null, period: null, sort: 'name-asc', page: 1
};
const pageSize = 8;
const collators = { en: new Intl.Collator('en', { sensitivity: 'base', numeric: true }), de: new Intl.Collator('de', { sensitivity: 'base', numeric: true }) };

// One result owns list, selection and page bounds, so consumers cannot display stale matches.
export function discoverSpecimens(catalog: readonly Specimen[], state: OverviewState, locale: 'en' | 'de') {
  const query = state.query.trim();
  const needle = query.toLocaleLowerCase(locale);
  const entries = catalog.filter(entry =>
    (!needle || entry.text[locale].name.toLocaleLowerCase(locale).includes(needle) || entry.scientificName.toLocaleLowerCase(locale).includes(needle)) &&
    (!state.diet || entry.diet === state.diet) &&
    (!state.period || entry.periods.includes(state.period))
  );
  const direction = state.sort === 'name-desc' ? -1 : 1;
  entries.sort((a, b) => direction * (collators[locale].compare(a.text[locale].name, b.text[locale].name) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)));
  const pages = Math.max(1, Math.ceil(entries.length / pageSize));
  const page = Number.isSafeInteger(state.page) && state.page > 0 ? Math.min(state.page, pages) : 1;
  const selected = entries.find(entry => entry.id === state.specimen) ?? entries[0] ?? null;
  return {
    entries, count: entries.length, pages, selected,
    pageEntries: entries.slice((page - 1) * pageSize, page * pageSize),
    state: { ...state, query, page, specimen: selected?.id ?? null }
  };
}
