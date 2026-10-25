import { getSpecimen, type SpecimenId } from './catalog.ts';

export type OverviewState = Readonly<{ specimen: SpecimenId; view: 'results' | 'spotlight'; index: number }>;

// Fragment-only browsing state: static documents need no server, cookies or storage.
export function readOverviewState(hash: string): OverviewState {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const index = Number(params.get('index'));
  return {
    specimen: getSpecimen(params.get('specimen')).id,
    view: params.get('view') === 'spotlight' ? 'spotlight' : 'results',
    index: Number.isFinite(index) && index > 0 ? Math.min(index, 100_000) : 0
  };
}

export function overviewHash(state: OverviewState): string {
  const params = new URLSearchParams({ specimen: state.specimen, view: state.view });
  if (state.index > 0) params.set('index', String(Math.round(state.index)));
  return `#${params}`;
}

export function exhibitOverviewHash(state: OverviewState): string {
  return `#overview=${encodeURIComponent(overviewHash(state).slice(1))}`;
}

export function returnToOverview(specimen: SpecimenId, exhibitHash: string): string {
  const context = new URLSearchParams(exhibitHash.replace(/^#/, '')).get('overview');
  const state = readOverviewState(context ?? '');
  // Only browsing position is transferable; never a study/playback query or another animal.
  return overviewHash({ specimen, view: 'spotlight', index: context ? state.index : 0 });
}
