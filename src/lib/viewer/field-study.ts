import { validateRecordingDuration } from './study-data.ts';
import type { StudyVersion } from './study-data.ts';

export type StudyView = {
  begin(): boolean;
  compose(): Promise<boolean>;
  pause(): void;
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

export function createFieldStudy(
  version: StudyVersion,
  view: StudyView,
  onChange: (snapshot: StudySnapshot) => void,
  media?: StudyMedia
): StudyHandle {
  const audio = media ?? new Audio();
  const meetEnd = version.chapters[1].start;
  const state: StudySnapshot = {
    active: false, phase: 'explore', requestedPlaying: false, time: 0,
    duration: version.duration, caption: '', captionsEnabled: true, error: null
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
      published.error === state.error &&
      (forceTime ? published.time === state.time : Math.floor(published.time * 10) === Math.floor(state.time * 10))
    ) return;
    published = { ...state };
    onChange(published);
  }

  function readTime(): void {
    if (metadataReady && Number.isFinite(audio.currentTime)) {
      state.time = Math.max(0, Math.min(audio.currentTime, meetEnd));
    }
    state.caption = '';
    if (!state.captionsEnabled) return;
    for (let index = 0; index < version.captions.length; ++index) {
      const caption = version.captions[index];
      if (state.time < caption.start) break;
      if (state.time < caption.end) {
        state.caption = caption.text;
        break;
      }
    }
  }

  function mayAdvance(): boolean {
    return !disposed && state.active && state.requestedPlaying && !state.error &&
      metadataReady && composed && !composing && !settlingSeek && !audio.seeking;
  }

  function sample(): void {
    if (state.phase !== 'playing' || !mayAdvance() || audio.paused) return;
    readTime();
    if (state.time >= meetEnd) exit();
    else publish();
  }

  function fail(kind: 'blocked' | 'media' | 'data'): void {
    if (disposed || !state.active) return;
    ++command;
    pendingPlay = null;
    composing = false;
    composed = false;
    state.requestedPlaying = false;
    state.error = kind;
    state.phase = kind === 'blocked' ? 'paused' : 'error';
    audio.pause();
    readTime();
    if (kind === 'blocked') {
      view.pause();
    } else {
      // compose locks input and clears paused inspection synchronously, even during failure.
      const token = command;
      try {
        void view.compose().then((success) => {
          if (!disposed && state.active && token === command && !success) exit();
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
    if (state.time >= meetEnd) {
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
      if (composed) view.pause();
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

  function compose(): void {
    const token = ++command;
    pendingPlay = null;
    composing = true;
    composed = false;
    state.phase = settlingSeek ? 'seeking' : metadataReady ? 'restoring' : 'loading';
    audio.pause();
    let result: Promise<boolean>;
    try {
      result = view.compose();
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
    function metadata(): void {
      if (state.error) return;
      try {
        validateRecordingDuration(version, audio.duration);
        metadataReady = true;
        state.duration = audio.duration;
        if (retainedSeek !== null) {
          const target = retainedSeek;
          retainedSeek = null;
          if (Math.abs(audio.currentTime - target) > 0.001) {
            audio.currentTime = target;
            settlingSeek = audio.seeking;
          }
        }
        readTime();
      } catch {
        fail('data');
        return;
      }
      if (state.time >= meetEnd) exit();
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
    listen('seeking', () => {
      if (!metadataReady || state.error || !audio.seeking) return;
      settlingSeek = true;
      compose();
    });
    listen('seeked', () => {
      if (!metadataReady || state.error || audio.seeking) return;
      settlingSeek = false;
      readTime();
      if (state.time >= meetEnd) exit();
      else ready();
      publish(true);
    });
    listen('timeupdate', sample);
    listen('ended', () => {
      if (!metadataReady || state.error || !audio.ended) return;
      readTime();
      if (state.time >= meetEnd) exit();
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
    compose();
    if (state.active) load(0);
  }

  function pause(): void {
    if (disposed || !state.active || state.phase === 'error') return;
    ++command;
    pendingPlay = null;
    composing = false;
    composed = false;
    state.requestedPlaying = false;
    audio.pause();
    readTime();
    view.pause();
    state.phase = 'paused';
    publish(true);
  }

  function play(): void {
    if (disposed || !state.active || (state.error && state.error !== 'blocked') || state.requestedPlaying) return;
    state.error = null;
    state.requestedPlaying = true;
    readTime();
    if (state.time >= meetEnd) exit();
    else compose();
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
    compose();
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
    publish(true);
  }

  function setCaptions(enabled: boolean): void {
    if (disposed || !state.active || state.captionsEnabled === enabled) return;
    state.captionsEnabled = enabled;
    readTime();
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
