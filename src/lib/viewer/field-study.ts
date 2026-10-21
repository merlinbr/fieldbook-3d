import { validateRecordingDuration } from './study-data.ts';
import type { StudyVersion } from './study-data.ts';

export type StudyFrame = {
  chapter: 'meet' | 'scale' | 'armor' | 'world';
  worldProgress: number;
  scaleProgress: number;
  armorProgress: number;
  region: 'armor' | 'tailClub';
  regionProgress: number;
};

export type StudyView = {
  begin(): boolean;
  compose(frame: Readonly<StudyFrame>): Promise<boolean>;
  present(frame: Readonly<StudyFrame>): void;
  freeze(): void;
  pause(frame: Readonly<StudyFrame>): void;
  exit(): void;
  setFrame(callback: (() => void) | null): void;
};

export type StudySnapshot = {
  active: boolean;
  phase: 'explore' | 'loading' | 'restoring' | 'playing' | 'paused' | 'buffering' | 'seeking' | 'error';
  requestedPlaying: boolean;
  time: number;
  duration: number;
  caption: string;
  captionsEnabled: boolean;
  error: null | 'blocked' | 'media' | 'data';
  chapter: StudyFrame['chapter'] | null;
};

export type StudyHandle = {
  start(): void;
  pause(): void;
  play(): void;
  retry(): void;
  exit(): void;
  setCaptions(enabled: boolean): void;
  dispose(): void;
};

type StudyMedia = Pick<HTMLAudioElement,
  'src' | 'preload' | 'currentTime' | 'duration' | 'paused' | 'seeking' | 'ended' | 'readyState' |
  'play' | 'pause' | 'load' | 'removeAttribute' | 'addEventListener' | 'removeEventListener'
>;

type StudyCue = StudyVersion['cues'][number];

function requireCue(version: StudyVersion, view: StudyCue['view']): StudyCue {
  const chapterIndex = view === 'hero' ? 0
    : view === 'scale' ? 1
    : view === 'armor' || view === 'tailClub' ? 2
    : 3;
  const start = version.chapters[chapterIndex].start;
  const end = version.chapters[chapterIndex + 1]?.start ?? version.duration;
  const cue = version.cues.find((candidate) =>
    candidate.view === view && candidate.start < end && candidate.end > start
  );
  if (!cue) throw new RangeError(`The resolved recording has no ${view} cue`);
  return cue;
}

function assignStudyFrame(
  version: StudyVersion,
  time: number,
  out: StudyFrame,
  scaleCue: StudyCue,
  armorCue: StudyCue,
  tailClubCue: StudyCue,
  worldCue: StudyCue
): void {
  const scaleStart = version.chapters[1].start;
  const armorStart = version.chapters[2].start;
  const deliveredEnd = version.duration;
  if (!Number.isFinite(time) || time < version.chapters[0].start || time >= deliveredEnd) {
    throw new RangeError('Study frames are available only during the recording');
  }
  out.scaleProgress = 0;
  out.worldProgress = 0;
  out.armorProgress = 0;
  out.region = 'armor';
  out.regionProgress = 0;
  if (time >= version.chapters[3].start) {
    out.chapter = 'world';
    const ramp = Math.min(0.75, worldCue.end - worldCue.start);
    out.worldProgress = Math.max(0, Math.min(1, (time - worldCue.start) / ramp));
    return;
  }
  if (time < scaleStart) {
    out.chapter = 'meet';
    return;
  }
  const scaleRamp = Math.min(0.75, scaleCue.end - scaleCue.start);
  out.scaleProgress = Math.max(0, Math.min(1, (time - scaleCue.start) / scaleRamp));
  if (time < armorStart) {
    out.chapter = 'scale';
    return;
  }
  out.chapter = 'armor';
  const armorRamp = Math.min(0.75, armorCue.end - armorCue.start);
  const armorProgress = Math.max(0, Math.min(1, (time - armorStart) / armorRamp));
  out.armorProgress = armorProgress * armorProgress * (3 - 2 * armorProgress);
  if (time >= tailClubCue.start) {
    out.region = 'tailClub';
    const tailClubRamp = Math.min(0.75, tailClubCue.end - tailClubCue.start);
    const progress = Math.max(0, Math.min(1, (time - tailClubCue.start) / tailClubRamp));
    out.regionProgress = progress * progress * (3 - 2 * progress);
  }
}

export function evaluateStudyFrame(version: StudyVersion, time: number, out: StudyFrame): void {
  assignStudyFrame(
    version,
    time,
    out,
    requireCue(version, 'scale'),
    requireCue(version, 'armor'),
    requireCue(version, 'tailClub'),
    requireCue(version, 'world')
  );
}

export function createFieldStudy(
  version: StudyVersion,
  view: StudyView,
  onChange: (snapshot: StudySnapshot) => void,
  media?: StudyMedia
): StudyHandle {
  const audio = media ?? new Audio();
  const deliveredEnd = version.duration;
  const scaleCue = requireCue(version, 'scale');
  const armorCue = requireCue(version, 'armor');
  const tailClubCue = requireCue(version, 'tailClub');
  const worldCue = requireCue(version, 'world');
  const frame: StudyFrame = {
    chapter: 'meet', worldProgress: 0, scaleProgress: 0, armorProgress: 0, region: 'armor', regionProgress: 0
  };
  const state: StudySnapshot = {
    active: false, phase: 'explore', requestedPlaying: false, time: 0,
    duration: version.duration, caption: '', captionsEnabled: true, error: null, chapter: null
  };
  let published: StudySnapshot | undefined;
  let disposed = false;
  let lifetime = 0;
  let command = 0;
  let metadataReady = false;
  let composed = false;
  let composing = false;
  let settlingSeek = false;
  let retainedSeek: number | null = null;
  let pendingPlay: number | null = null;
  let removeMediaListeners = () => {};

  function publish(forceTime = false): void {
    if (disposed) return;
    if (published &&
      published.active === state.active && published.phase === state.phase &&
      published.requestedPlaying === state.requestedPlaying && published.duration === state.duration &&
      published.caption === state.caption && published.captionsEnabled === state.captionsEnabled &&
      published.error === state.error && published.chapter === state.chapter &&
      (forceTime ? published.time === state.time : Math.floor(published.time * 10) === Math.floor(state.time * 10))
    ) return;
    published = { ...state };
    onChange(published);
  }

  function frameCopy(): StudyFrame {
    return {
      chapter: frame.chapter,
      worldProgress: frame.worldProgress,
      scaleProgress: frame.scaleProgress,
      armorProgress: frame.armorProgress,
      region: frame.region,
      regionProgress: frame.regionProgress
    };
  }
  function readTime(): boolean {
    if (metadataReady && Number.isFinite(audio.currentTime)) {
      state.time = Math.max(0, Math.min(audio.currentTime, state.duration));
    }
    const complete = state.time >= deliveredEnd;
    if (complete) {
      state.chapter = null;
    } else {
      assignStudyFrame(version, state.time, frame, scaleCue, armorCue, tailClubCue, worldCue);
      state.chapter = frame.chapter;
    }
    state.caption = '';
    if (state.captionsEnabled) {
      for (let index = 0; index < version.captions.length; ++index) {
        const caption = version.captions[index];
        if (state.time < caption.start) break;
        if (state.time < caption.end) {
          state.caption = caption.text;
          break;
        }
      }
    }
    return complete;
  }

  function mayAdvance(): boolean {
    return !disposed && state.active && state.requestedPlaying && !state.error &&
      metadataReady && composed && !composing && !settlingSeek && !audio.seeking;
  }

  function sample(): void {
    if (state.phase !== 'playing' || !mayAdvance() || audio.paused) return;
    if (readTime()) {
      exit();
      return;
    }
    view.present(frame);
    publish();
  }

  function fail(kind: 'blocked' | 'media' | 'data'): void {
    if (disposed || !state.active) return;
    const wasSeeking = settlingSeek || audio.seeking;
    ++command;
    pendingPlay = null;
    composing = false;
    composed = false;
    state.requestedPlaying = false;
    audio.pause();
    if (!wasSeeking && readTime()) {
      exit();
      return;
    }
    settlingSeek = false;
    state.error = kind;
    state.phase = kind === 'blocked' ? 'paused' : 'error';
    if (kind === 'blocked') {
      view.pause(frameCopy());
    } else {
      composing = true;
      const token = command;
      try {
        void view.compose(frameCopy()).then((success) => {
          if (disposed || !state.active || token !== command) return;
          composing = false;
          if (!success) exit();
          else composed = true;
        }).catch(() => {
          if (!disposed && state.active && token === command) exit();
        });
      } catch {
        exit();
      }
    }
    publish(true);
  }

  function attemptPlay(): void {
    if (!mayAdvance() || pendingPlay !== null) return;
    if (readTime()) {
      exit();
      return;
    }
    const token = command;
    const epoch = lifetime;
    pendingPlay = token;
    state.phase = 'buffering';
    publish();
    let result: Promise<void>;
    try {
      result = audio.play();
    } catch (error) {
      pendingPlay = null;
      fail(error instanceof Error && error.name === 'NotAllowedError' ? 'blocked' : 'media');
      return;
    }
    void result.then(() => {
      if (disposed || !state.active || epoch !== lifetime || token !== command) {
        // A canceled play promise can still start the shared native element.
        if (!mayAdvance()) audio.pause();
        return;
      }
      pendingPlay = null;
      if (!mayAdvance()) {
        audio.pause();
        return;
      }
      state.phase = audio.readyState >= 3 && !audio.paused ? 'playing' : 'buffering';
      sample();
      publish();
    }).catch((error: unknown) => {
      if (disposed || !state.active || epoch !== lifetime || token !== command) {
        if (!mayAdvance()) audio.pause();
        return;
      }
      pendingPlay = null;
      fail(error instanceof Error && error.name === 'NotAllowedError' ? 'blocked' : 'media');
    });
  }

  function ready(): void {
    if (disposed || !state.active || state.error || !metadataReady || settlingSeek || audio.seeking || composing) return;
    if (!state.requestedPlaying) {
      if (composed) view.pause(frameCopy());
      composed = false;
      state.phase = 'paused';
      publish(true);
    } else if (composed) {
      if (audio.readyState < 3) {
        state.phase = 'buffering';
        publish();
      } else if (!audio.paused) {
        state.phase = 'playing';
        sample();
        publish();
      } else {
        attemptPlay();
      }
    }
  }

  function compose(target: Readonly<StudyFrame>): void {
    const targetFrame: StudyFrame = {
      chapter: target.chapter,
      worldProgress: target.worldProgress,
      scaleProgress: target.scaleProgress,
      armorProgress: target.armorProgress,
      region: target.region,
      regionProgress: target.regionProgress
    };
    const token = ++command;
    pendingPlay = null;
    composing = true;
    composed = false;
    state.phase = metadataReady ? 'restoring' : 'loading';
    audio.pause();
    let result: Promise<boolean>;
    try {
      result = view.compose(targetFrame);
    } catch {
      exit();
      return;
    }
    publish();
    void result.then((success) => {
      if (disposed || !state.active || token !== command) return;
      composing = false;
      if (!success) {
        exit();
        return;
      }
      composed = true;
      ready();
    }).catch(() => {
      if (!disposed && state.active && token === command) exit();
    });
  }

  function load(retainedTime: number): void {
    removeMediaListeners();
    const epoch = ++lifetime;
    metadataReady = false;
    settlingSeek = false;
    retainedSeek = retainedTime;
    const listeners: [string, EventListener][] = [];
    function listen(name: string, callback: () => void): void {
      const listener: EventListener = () => {
        if (!disposed && state.active && epoch === lifetime) callback();
      };
      audio.addEventListener(name, listener);
      listeners.push([name, listener]);
    }
    removeMediaListeners = () => {
      for (const [name, listener] of listeners) audio.removeEventListener(name, listener);
    };
    function freezeForSeek(): void {
      if (!metadataReady || state.error || !audio.seeking || settlingSeek) return;
      settlingSeek = true;
      ++command;
      pendingPlay = null;
      composing = false;
      composed = false;
      audio.pause();
      view.freeze();
      state.phase = 'seeking';
      publish(true);
    }

    function metadata(): void {
      if (state.error) return;
      let positionRestored = false;
      try {
        validateRecordingDuration(version, audio.duration);
        metadataReady = true;
        state.duration = audio.duration;
        if (retainedSeek !== null) {
          const target = retainedSeek;
          retainedSeek = null;
          if (Math.abs(audio.currentTime - target) > 0.001) {
            positionRestored = true;
            audio.currentTime = target;
          }
        }
      } catch {
        fail('data');
        return;
      }
      if (audio.seeking || settlingSeek) {
        freezeForSeek();
        return;
      }
      if (readTime()) {
        exit();
        return;
      }
      if (positionRestored) compose(frameCopy());
      else ready();
      publish();
    }
    listen('loadedmetadata', metadata);
    listen('durationchange', () => {
      if (audio.readyState >= 1) metadata();
    });
    listen('canplay', ready);
    listen('playing', () => {
      if (!mayAdvance()) {
        audio.pause();
        return;
      }
      state.phase = 'playing';
      sample();
      publish();
    });
    listen('pause', () => {
      if (audio.paused && state.requestedPlaying && !composing && !settlingSeek &&
        (state.phase === 'playing' || state.phase === 'buffering')) pause();
    });
    function buffering(): void {
      if (mayAdvance() && audio.readyState < 3) {
        state.phase = 'buffering';
        publish();
      }
    }
    listen('waiting', buffering);
    listen('stalled', buffering);
    listen('seeking', freezeForSeek);
    listen('seeked', () => {
      if (!metadataReady || state.error || audio.seeking || !settlingSeek) return;
      settlingSeek = false;
      if (readTime()) {
        exit();
        return;
      }
      compose(frameCopy());
      publish(true);
    });
    listen('timeupdate', sample);
    listen('ended', () => {
      if (!metadataReady || state.error || !audio.ended) return;
      if (readTime()) exit();
      else fail('media');
    });
    listen('error', () => fail('media'));
    try {
      audio.preload = 'auto';
      audio.src = version.url;
      audio.load();
    } catch {
      fail('media');
    }
  }

  function start(): void {
    if (disposed || state.active || !view.begin()) return;
    state.active = true;
    state.requestedPlaying = true;
    state.time = 0;
    state.duration = version.duration;
    state.captionsEnabled = true;
    state.error = null;
    state.phase = 'loading';
    readTime();
    view.setFrame(sample);
    compose(frameCopy());
    if (state.active) load(0);
  }

  function pause(): void {
    if (disposed || !state.active || state.phase === 'error') return;
    const seeking = settlingSeek || audio.seeking;
    ++command;
    pendingPlay = null;
    composing = false;
    composed = false;
    state.requestedPlaying = false;
    audio.pause();
    if (seeking) {
      settlingSeek = true;
      view.freeze();
      state.phase = 'seeking';
      publish(true);
      return;
    }
    if (readTime()) {
      exit();
      return;
    }
    view.pause(frameCopy());
    state.phase = 'paused';
    publish(true);
  }

  function play(): void {
    if (disposed || !state.active || (state.error && state.error !== 'blocked') || state.requestedPlaying) return;
    state.error = null;
    state.requestedPlaying = true;
    if (settlingSeek || audio.seeking) {
      state.phase = 'seeking';
      publish(true);
      return;
    }
    if (readTime()) {
      exit();
      return;
    }
    compose(frameCopy());
  }

  function retry(): void {
    if (disposed || !state.active || (state.error !== 'media' && state.error !== 'data')) return;
    state.error = null;
    state.requestedPlaying = false;
    state.phase = 'loading';
    const retainedTime = state.time;
    // Reset readiness before composing so synchronous media events cannot unlock the retry early.
    metadataReady = false;
    settlingSeek = false;
    compose(frameCopy());
    if (state.active) load(retainedTime);
  }

  function unload(): void {
    ++lifetime;
    ++command;
    pendingPlay = null;
    composing = false;
    composed = false;
    metadataReady = false;
    settlingSeek = false;
    retainedSeek = null;
    removeMediaListeners();
    removeMediaListeners = () => {};
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }

  function exit(): void {
    if (disposed || !state.active) return;
    state.active = false;
    state.requestedPlaying = false;
    view.setFrame(null);
    unload();
    view.exit();
    state.phase = 'explore';
    state.time = 0;
    state.caption = '';
    state.error = null;
    state.chapter = null;
    frame.chapter = 'meet';
    frame.scaleProgress = 0;
    publish(true);
  }

  function setCaptions(enabled: boolean): void {
    if (disposed || !state.active || state.captionsEnabled === enabled) return;
    state.captionsEnabled = enabled;
    if (readTime()) {
      exit();
      return;
    }
    publish(true);
  }

  function onVisibility(): void {
    if (document.visibilityState === 'hidden') pause();
  }

  function onPageHide(event: PageTransitionEvent): void {
    if (event.persisted) exit();
    else dispose();
  }

  function dispose(): void {
    if (disposed) return;
    exit();
    view.setFrame(null);
    if (typeof window !== 'undefined') window.removeEventListener('pagehide', onPageHide);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
    disposed = true;
  }

  if (typeof window !== 'undefined') window.addEventListener('pagehide', onPageHide);
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);
  publish();
  return { start, pause, play, retry, exit, setCaptions, dispose };
}
