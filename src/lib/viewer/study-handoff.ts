import type { StudyVersion } from './study-data.ts';

export type ExplorationView = Readonly<{ azimuth: number; polar: number; zoom: number }>;
export type StudyHandoff = Readonly<{
  specimen: 'ankylosaurus';
  version: string;
  time: number;
  chapter: StudyVersion['chapters'][number]['id'];
  captions: boolean;
  view: ExplorationView;
}>;

export const STUDY_QUERY = 'study';

function bounded(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum;
}

export function validExplorationView(value: unknown): value is ExplorationView {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const view = value as Record<string, unknown>;
  return bounded(view.azimuth, -Math.PI, Math.PI) &&
    bounded(view.polar, 0.1, Math.PI / 2 - 0.025) && bounded(view.zoom, 0.6, 2.5);
}

export function encodeStudyHandoff(context: StudyHandoff): string {
  return JSON.stringify(context);
}

// Only known complete versions of this specimen may supply handoffs. Query data never supplies media URLs.
export function parseStudyHandoff(
  raw: string,
  versions: readonly StudyVersion[],
  destination: StudyVersion
): StudyHandoff | null {
  if (raw.length > 1024) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || data.specimen !== 'ankylosaurus' || typeof data.version !== 'string' ||
      typeof data.captions !== 'boolean' || !validExplorationView(data.view)) return null;
    const source = versions.find((version) => version.id === data.version);
    if (!source || !bounded(data.time, 0, source.duration)) return null;
    const chapter = source.chapters.findLast((chapter) => chapter.start <= data.time);
    if (!chapter || chapter.id !== data.chapter) return null;
    const target = destination.chapters.find((candidate) => candidate.id === chapter.id);
    if (!target) return null;
    return {
      specimen: 'ankylosaurus', version: destination.id,
      time: source.id === destination.id ? data.time : target.start,
      chapter: chapter.id, captions: data.captions,
      view: { azimuth: data.view.azimuth, polar: data.view.polar, zoom: data.view.zoom }
    };
  } catch {
    return null;
  }
}
