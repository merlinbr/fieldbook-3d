import { specimens, type Specimen, type SpecimenId } from './catalog.ts';
import { defaultOverviewState, discoverSpecimens, type OverviewState } from './catalog-query.ts';

// Fragment-only browsing state: static documents need no server, cookies or storage.
export function readOverviewState(hash: string, catalog: readonly Specimen[] = specimens, locale: 'en' | 'de' = 'en'): OverviewState {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const index = Number(params.get('index'));
  const diet = params.get('diet');
  const period = params.get('period');
  return discoverSpecimens(catalog, {
    ...defaultOverviewState,
    specimen: params.get('specimen'),
    view: params.get('view') === 'spotlight' ? 'spotlight' : 'results',
    index: Number.isFinite(index) && index > 0 ? Math.min(index, 100_000) : 0,
    query: params.get('query') ?? '',
    diet: diet === 'herbivore' || diet === 'carnivore' || diet === 'omnivore' ? diet : null,
    period: period === 'triassic' || period === 'jurassic' || period === 'cretaceous' ? period : null,
    sort: params.get('sort') === 'name-desc' ? 'name-desc' : 'name-asc',
    page: params.has('page') ? Number(params.get('page')) : 1
  }, locale).state;
}

export function overviewHash(state: OverviewState): string {
  const params = new URLSearchParams({ view: state.view });
  if (state.specimen) params.set('specimen', state.specimen);
  if (state.index > 0) params.set('index', String(Math.round(state.index)));
  if (state.query.trim()) params.set('query', state.query.trim());
  if (state.diet) params.set('diet', state.diet);
  if (state.period) params.set('period', state.period);
  if (state.sort !== 'name-asc') params.set('sort', state.sort);
  if (state.page !== 1) params.set('page', String(state.page));
  return `#${params}`;
}

export function exhibitOverviewHash(state: OverviewState): string {
  return `#overview=${encodeURIComponent(overviewHash(state).slice(1))}`;
}

export function returnToOverview(specimen: SpecimenId, exhibitHash: string, locale: 'en' | 'de' = 'en'): string {
  const context = new URLSearchParams(exhibitHash.replace(/^#/, '')).get('overview');
  const state = readOverviewState(context ?? '', specimens, locale);
  // Transfer only validated browsing context, never study/playback state or a URL.
  const next = discoverSpecimens(specimens, { ...state, specimen, view: 'spotlight' }, locale).state;
  return overviewHash(next);
}
