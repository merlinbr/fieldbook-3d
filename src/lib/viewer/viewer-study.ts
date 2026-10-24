import type { SpecimenViewerConfig, ViewerStudy } from '../specimens/specimen-config.ts';
import { parseStudyHandoff } from './study-handoff.ts';
import type { StudyHandoff } from './study-handoff.ts';

export function resolveStudyContext(config: SpecimenViewerConfig, study: ViewerStudy, contexts: readonly string[]): {
  incoming: StudyHandoff | null; handoffFailed: boolean;
} {
  if (config.study.kind === 'none' || study.kind === 'none' || !contexts.length) return { incoming: null, handoffFailed: false };
  const incoming = config.id === 'ankylosaurus' && contexts.length === 1 && study.recording.version
    ? parseStudyHandoff(contexts[0], study.versions, study.recording.version) : null;
  return { incoming, handoffFailed: !incoming };
}
