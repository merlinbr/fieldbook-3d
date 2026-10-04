export type StudyVersion = Readonly<{
  id: string;
  language: 'en';
  url: string;
  duration: number;
  chapters: readonly Readonly<{ id: 'meet' | 'scale' | 'armor' | 'world'; start: number }>[];
  cues: readonly Readonly<{
    start: number;
    end: number;
    view: 'hero' | 'scale' | 'armor' | 'tailClub' | 'world';
  }>[];
  captions: readonly Readonly<{ start: number; end: number; text: string }>[];
  provenance: Readonly<{
    voice: string;
    generated: string;
    terms: string;
    attribution: string;
    paidPlanEvidence: string;
  }>;
}>;

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Study data must contain objects');
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('Study text must not be empty');
  }
  return value.trim();
}

function time(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new RangeError('Study timestamps must be finite and nonnegative');
  }
  return value;
}

function mediaUrl(value: unknown): string {
  const url = new URL(text(value));
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new TypeError('Study media requires a credential-free HTTP(S) URL');
  }
  for (const key of url.searchParams.keys()) {
    if (
      /(?:token|key|secret|password|passwd|credential|authorization|auth|signature)/i.test(key) ||
      /^(?:sig|hmac|jwt)$/i.test(key)
    ) {
      throw new TypeError('Public study media URLs must not contain credential parameters');
    }
  }
  return url.href;
}

function intervals<T extends { start: number; end: number }>(
  values: unknown,
  duration: number,
  resolve: (value: Record<string, unknown>) => T
): readonly Readonly<T>[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new TypeError('Study intervals must not be empty');
  }
  let previousEnd = 0;
  return Object.freeze(values.map((raw) => {
    const value = resolve(object(raw));
    if (value.start < previousEnd || value.end <= value.start || value.end > duration) {
      throw new RangeError('Study intervals must be ordered, non-overlapping, and bounded');
    }
    previousEnd = value.end;
    return Object.freeze(value);
  }));
}

export function parseStudyVersion(raw: string | undefined): {
  version: StudyVersion | null;
  error: 'missing' | 'data' | null;
} {
  if (raw === undefined || !raw.trim()) return { version: null, error: 'missing' };
  try {
    const data = object(JSON.parse(raw));
    const duration = time(data.duration);
    if (duration < 30 || duration > 60 || data.language !== 'en') {
      throw new RangeError('This study requires a 30–60 second English recording');
    }
    const chapterIds = ['meet', 'scale', 'armor', 'world'] as const;
    if (!Array.isArray(data.chapters) || data.chapters.length !== chapterIds.length) {
      throw new TypeError('All four study chapters are required');
    }
    let previousStart = -1;
    const chapters = Object.freeze(data.chapters.map((rawChapter, index) => {
      const chapter = object(rawChapter);
      const start = time(chapter.start);
      if (
        chapter.id !== chapterIds[index] || start <= previousStart || start >= duration ||
        (index === 0 && start !== 0)
      ) {
        throw new RangeError('Study chapters must be ordered and begin with Meet at zero');
      }
      previousStart = start;
      return Object.freeze({ id: chapterIds[index], start });
    }));
    const views = ['hero', 'scale', 'armor', 'tailClub', 'world'] as const;
    const cues = intervals(data.cues, duration, (cue) => {
      if (!views.includes(cue.view as typeof views[number])) {
        throw new TypeError('Unknown study view');
      }
      return {
        start: time(cue.start), end: time(cue.end),
        view: cue.view as typeof views[number]
      };
    });
    if (cues[0].start !== 0 || cues[0].view !== 'hero') {
      throw new RangeError('Meet requires a hero cue beginning at zero');
    }
    const captions = intervals(data.captions, duration, (caption) => ({
      start: time(caption.start), end: time(caption.end), text: text(caption.text)
    }));
    const requiredViews = [['hero'], ['scale'], ['armor', 'tailClub'], ['world']] as const;
    for (let index = 0; index < chapters.length; ++index) {
      const start = chapters[index].start;
      const end = chapters[index + 1]?.start ?? duration;
      if (
        !captions.some((caption) => caption.start < end && caption.end > start) ||
        !requiredViews[index].every((view) => cues.some((cue) =>
          cue.view === view && cue.start < end && cue.end > start
        ))
      ) {
        throw new TypeError('Every chapter requires recording-aligned captions and its visual cues');
      }
    }
    const source = object(data.provenance);
    const provenance = Object.freeze({
      voice: text(source.voice), generated: text(source.generated), terms: text(source.terms),
      attribution: text(source.attribution), paidPlanEvidence: text(source.paidPlanEvidence)
    });
    return {
      version: Object.freeze({
        id: text(data.id), language: 'en', url: mediaUrl(data.url), duration,
        chapters, cues, captions, provenance
      }),
      error: null
    };
  } catch {
    return { version: null, error: 'data' };
  }
}

export function validateRecordingDuration(version: StudyVersion, actual: number): void {
  if (!Number.isFinite(actual) || actual < 30 || actual > 60 || Math.abs(actual - version.duration) > 0.25) {
    throw new RangeError('Recording duration does not match study data');
  }
  if (
    version.chapters.some((chapter) => chapter.start >= actual) ||
    version.cues.some((cue) => cue.start >= actual || cue.end > actual) ||
    version.captions.some((caption) => caption.start >= actual || caption.end > actual)
  ) {
    throw new RangeError('Study timestamps exceed the actual recording');
  }
}
