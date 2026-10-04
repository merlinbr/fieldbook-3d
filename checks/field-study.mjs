import assert from 'node:assert/strict';
import { parseStudyVersion, validateRecordingDuration } from '../src/lib/viewer/study-data.ts';
import { createFieldStudy } from '../src/lib/viewer/field-study.ts';

// In-memory boundary inputs only: not production timings or a substitute for narrated acceptance.
const data = {
  id: 'boundary-check', language: 'en', url: 'https://media.example.org/narration.mp3', duration: 40,
  chapters: [
    { id: 'meet', start: 0 }, { id: 'scale', start: 10 },
    { id: 'armor', start: 20 }, { id: 'world', start: 30 }
  ],
  cues: [
    { start: 0, end: 10, view: 'hero' }, { start: 10, end: 20, view: 'scale' },
    { start: 20, end: 25, view: 'armor' }, { start: 25, end: 30, view: 'tailClub' },
    { start: 30, end: 40, view: 'world' }
  ],
  captions: [
    { start: 0, end: 2, text: 'Opening caption' },
    { start: 2, end: 4, text: 'Following caption' },
    { start: 9, end: 10, text: 'Meet ending' },
    { start: 10, end: 20, text: 'Scale caption' },
    { start: 20, end: 30, text: 'Armor caption' },
    { start: 30, end: 40, text: 'World caption' }
  ],
  provenance: {
    voice: 'check-only voice', generated: 'check-only date', terms: 'check-only terms',
    attribution: 'check-only attribution', paidPlanEvidence: 'check-only reference'
  }
};
const parse = (value) => parseStudyVersion(JSON.stringify(value));
const { version, error } = parse(data);
assert.equal(error, null);
assert.ok(version);
assert.equal(parseStudyVersion(undefined).error, 'missing');
assert.equal(parseStudyVersion(' ').error, 'missing');
assert.equal(parseStudyVersion('{').error, 'data');
for (const change of [
  { language: 'de' }, { duration: 29 }, { duration: 61 }, { provenance: {} },
  { captions: [] }, { captions: [{ start: 10, end: 12, text: 'Not Meet' }] },
  { captions: [{ start: 0, end: 1, text: ' ' }] },
  { cues: [] }, { cues: [{ start: 0, end: 10, view: 'armor' }] },
  { cues: [{ start: 0, end: 41, view: 'hero' }] },
  { cues: [{ start: 0, end: 2, view: 'hero' }, { start: 1, end: 3, view: 'hero' }] },
  { captions: [{ start: 0, end: 2, text: 'One' }, { start: 1, end: 3, text: 'Overlap' }] },
  { chapters: data.chapters.slice(0, 3) },
  { chapters: data.chapters.map((chapter) => ({ ...chapter, start: 0 })) },
  { url: 'file:///narration.mp3' }, { url: '/narration.mp3' },
  { url: 'https://user:password@media.example.org/narration.mp3' },
  { url: 'https://media.example.org/narration.mp3?access_token=private' },
  { url: 'https://media.example.org/narration.mp3?api%5Fkey=private' },
  { url: 'https://media.example.org/narration.mp3?sv=2025-01-05&sp=r&sr=b&sig=private' },
  { url: 'https://media.example.org/narration.mp3?hmac=private' },
  { url: 'https://media.example.org/narration.mp3?jwt=private' }
]) assert.equal(parse({ ...data, ...change }).error, 'data');
for (let index = 0; index < data.chapters.length; ++index) {
  const start = data.chapters[index].start;
  const end = data.chapters[index + 1]?.start ?? data.duration;
  const captions = data.captions.filter((caption) => caption.end <= start || caption.start >= end);
  assert.equal(parse({ ...data, captions }).error, 'data', 'each chapter requires overlapping captions');
}
for (const view of ['hero', 'scale', 'armor', 'tailClub', 'world']) {
  const cues = data.cues.filter((cue) => cue.view !== view);
  assert.equal(parse({ ...data, cues }).error, 'data', `missing ${view} cue must be rejected`);
}
const wrongChapterCues = data.cues.map((cue) => ({
  ...cue, view: cue.view === 'scale' ? 'armor' : cue.view === 'armor' ? 'scale' : cue.view
}));
assert.equal(parse({ ...data, cues: wrongChapterCues }).error, 'data', 'required cues must overlap their own chapter');
assert.ok(Object.isFrozen(version) && Object.isFrozen(version.chapters));
assert.ok(Object.isFrozen(version.chapters[0]) && Object.isFrozen(version.captions[0]));
assert.ok(Object.isFrozen(version.cues) && Object.isFrozen(version.provenance));
assert.throws(() => { version.chapters[0].start = 1; }, TypeError);
validateRecordingDuration(version, 40.25);
for (const duration of [NaN, Infinity, 0, 40.251, 39.9]) {
  assert.throws(() => validateRecordingDuration(version, duration), RangeError);
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function settle() {
  await Promise.resolve();
  await Promise.resolve();
}

// Native-media-shaped event source drives the production state machine, including delayed promises.
class MediaProbe extends EventTarget {
  src = '';
  preload = 'none';
  duration = NaN;
  readyState = 0;
  paused = true;
  seeking = false;
  ended = false;
  loads = 0;
  plays = [];
  position = 0;
  get currentTime() { return this.position; }
  set currentTime(value) {
    this.position = value;
    this.seeking = true;
    this.emit('seeking');
  }
  emit(name) { this.dispatchEvent(new Event(name)); }
  removeAttribute(name) { if (name === 'src') this.src = ''; }
  load() {
    ++this.loads;
    this.position = 0;
    this.duration = NaN;
    this.readyState = 0;
    this.paused = true;
    this.seeking = false;
    this.ended = false;
  }
  pause() {
    if (this.paused) return;
    this.paused = true;
    this.emit('pause');
  }
  play() {
    const pending = deferred();
    this.plays.push(pending);
    return pending.promise;
  }
  metadata(duration = 40) {
    this.duration = duration;
    this.readyState = 1;
    this.emit('loadedmetadata');
  }
  canplay() { this.readyState = 4; this.emit('canplay'); }
  finishPlay(index = this.plays.length - 1) {
    this.paused = false;
    this.emit('playing');
    this.plays[index].resolve();
  }
  finishSeek() { this.seeking = false; this.emit('seeked'); }
  at(time) { this.position = time; this.emit('timeupdate'); }
}

const windowEvents = new EventTarget();
const documentEvents = new EventTarget();
documentEvents.visibilityState = 'visible';
globalThis.window = windowEvents;
globalThis.document = documentEvents;

function harness() {
  const audio = new MediaProbe();
  const compositions = [];
  let snapshot;
  let notifications = 0;
  const view = {
    locked: false, inspection: null, frame: null, exits: 0,
    begin: () => true,
    compose() {
      this.locked = true;
      this.inspection = null;
      const pending = deferred();
      compositions.push(pending);
      return pending.promise;
    },
    pause() { this.locked = false; },
    exit() { this.locked = false; this.inspection = null; ++this.exits; },
    setFrame(callback) { this.frame = callback; }
  };
  const study = createFieldStudy(version, view, (next) => { snapshot = next; ++notifications; }, audio);
  return {
    audio, view, study,
    get snapshot() { return snapshot; },
    get compositionCount() { return compositions.length; },
    get notifications() { return notifications; },
    async composed(index = compositions.length - 1) { compositions[index].resolve(true); await settle(); }
  };
}

// Native pause can finalize its clock after the last playing/error sample.
for (const action of ['pause', 'error']) {
  const frozen = harness();
  frozen.study.start();
  frozen.audio.metadata();
  frozen.audio.canplay();
  await frozen.composed();
  frozen.audio.finishPlay();
  frozen.audio.at(1.95);
  const nativePause = frozen.audio.pause.bind(frozen.audio);
  frozen.audio.pause = () => { frozen.audio.position = 2.05; nativePause(); };
  if (action === 'pause') frozen.study.pause();
  else frozen.audio.emit('error');
  assert.equal(frozen.snapshot.time, 2.05, `${action} retains the finalized native position`);
  assert.equal(frozen.snapshot.caption, 'Following caption', `${action} uses the stopped caption boundary`);
  frozen.audio.pause = nativePause;
  frozen.study.dispose();
}

const h = harness();
assert.equal(h.audio.loads, 0);
assert.equal(h.snapshot.phase, 'explore');
h.study.start();
h.audio.metadata();
h.audio.canplay();
assert.equal(h.audio.plays.length, 0, 'composition must finish before any audio play request');
assert.equal(h.view.locked, true);
await h.composed();
h.audio.finishPlay();
await settle();
assert.equal(h.snapshot.phase, 'playing');
h.audio.at(1.25);
h.view.frame();
assert.equal(h.snapshot.time, 1.25);
assert.equal(h.snapshot.caption, 'Opening caption');
const notifications = h.notifications;
h.view.frame();
assert.equal(h.notifications, notifications, 'unchanged frames must not publish');
h.study.pause();
h.audio.at(1.8);
h.view.frame();
assert.equal(h.snapshot.time, 1.25, 'paused sampling must not advance presentation');
assert.equal(h.view.locked, false);

for (const [target, caption] of [[2, 'Following caption'], [1.9, 'Opening caption'], [4, '']]) {
  h.audio.currentTime = target;
  assert.equal(h.snapshot.phase, 'seeking');
  assert.equal(h.view.locked, true);
  h.audio.finishSeek();
  await h.composed();
  assert.equal(h.snapshot.phase, 'paused');
  assert.equal(h.snapshot.time, target);
  assert.equal(h.snapshot.caption, caption);
  assert.equal(h.view.locked, false);
}

const firstSeek = h.compositionCount;
h.audio.currentTime = 2;
h.audio.currentTime = 1.5;
h.audio.finishSeek();
await h.composed(firstSeek);
assert.equal(h.snapshot.phase, 'seeking', 'an older reframe cannot finish a newer seek');
await h.composed();
assert.equal(h.snapshot.phase, 'paused');
assert.equal(h.snapshot.time, 1.5);
assert.equal(h.snapshot.caption, 'Opening caption');

const playsBeforePause = h.audio.plays.length;
h.view.inspection = 'head';
h.study.play();
assert.equal(h.view.inspection, null, 'Resume clears paused inspection before restoration');
assert.equal(h.view.locked, true);
h.study.pause();
await h.composed();
assert.equal(h.audio.plays.length, playsBeforePause, 'Pause cancels a pending reframe');
h.study.play();
await h.composed();
h.study.pause();
h.audio.finishPlay();
await settle();
assert.equal(h.snapshot.phase, 'paused');
assert.equal(h.audio.paused, true, 'a stale play promise cannot restart paused audio');

h.study.play();
await h.composed();
h.audio.plays.at(-1).reject(Object.assign(new Error('Denied'), { name: 'NotAllowedError' }));
await settle();
assert.equal(h.snapshot.error, 'blocked');
assert.equal(h.snapshot.phase, 'paused');
assert.equal(h.view.locked, false);
h.study.play();
await h.composed();
h.audio.finishPlay();
await settle();
assert.equal(h.snapshot.error, null);
h.audio.at(3.25);
h.audio.readyState = 2;
h.audio.emit('waiting');
h.audio.at(3.5);
h.view.frame();
assert.equal(h.snapshot.phase, 'buffering');
assert.equal(h.snapshot.time, 3.25, 'buffering freezes presentation');
documentEvents.visibilityState = 'hidden';
documentEvents.dispatchEvent(new Event('visibilitychange'));
assert.equal(h.snapshot.phase, 'paused');
assert.equal(h.snapshot.requestedPlaying, false);
documentEvents.visibilityState = 'visible';
h.view.inspection = 'armor';
h.audio.emit('error');
assert.equal(h.snapshot.phase, 'error');
assert.equal(h.snapshot.error, 'media');
assert.equal(h.view.locked, true);
assert.equal(h.view.inspection, null);
await h.composed();
const retained = h.snapshot.time;
const playsBeforeRetry = h.audio.plays.length;
h.study.retry();
assert.equal(h.snapshot.phase, 'loading');
assert.equal(h.view.locked, true);
assert.equal(h.audio.src, version.url);
h.audio.metadata();
h.audio.canplay();
h.audio.finishSeek();
await h.composed();
assert.equal(h.snapshot.phase, 'paused');
assert.equal(h.snapshot.time, retained);
assert.equal(h.view.locked, false);
assert.equal(h.audio.plays.length, playsBeforeRetry, 'Retry must require explicit Play');

h.study.setCaptions(false);
h.study.play();
await h.composed();
h.study.exit();
const exitedNotifications = h.notifications;
h.audio.finishPlay();
h.audio.emit('error');
await settle();
assert.equal(h.snapshot.phase, 'explore');
assert.equal(h.audio.paused, true);
assert.equal(h.audio.src, '');
assert.equal(h.view.frame, null);
assert.equal(h.view.exits, 1);
assert.equal(h.notifications, exitedNotifications, 'late media cannot mutate an exited study');
h.study.start();
assert.equal(h.snapshot.captionsEnabled, true);
h.audio.metadata();
h.audio.canplay();
h.study.pause();
await h.composed();
assert.equal(h.snapshot.phase, 'paused', 'loaded media cannot undo Pause during initial composition');
h.study.play();
await h.composed();
h.audio.finishPlay();
await settle();
h.audio.at(10);
assert.equal(h.snapshot.phase, 'explore', 'Meet completes at scale start, not recording end');
assert.equal(h.view.exits, 2);

h.study.start();
h.audio.metadata();
h.audio.canplay();
await h.composed();
windowEvents.dispatchEvent(Object.assign(new Event('pagehide'), { persisted: true }));
const cachedNotifications = h.notifications;
h.audio.finishPlay();
await settle();
assert.equal(h.snapshot.phase, 'explore');
assert.equal(h.audio.paused, true, 'persisted pagehide cancels pending playback');
assert.equal(h.audio.src, '');
assert.equal(h.view.frame, null);
assert.equal(h.notifications, cachedNotifications, 'late playback cannot mutate a cached page');
windowEvents.dispatchEvent(new Event('pageshow'));
h.study.start();
assert.equal(h.snapshot.active, true, 'restored BFCache controller must accept Start');
assert.equal(h.snapshot.phase, 'loading');
windowEvents.dispatchEvent(Object.assign(new Event('pagehide'), { persisted: true }));
await h.composed();
assert.equal(h.snapshot.phase, 'explore', 'persisted pagehide also cancels pending composition');
h.study.start();
h.audio.metadata();
h.audio.canplay();
await h.composed();
h.audio.finishPlay();
await settle();
assert.equal(h.snapshot.phase, 'playing', 'cached controller remains fully playable');
h.study.exit();

h.study.start();
h.audio.metadata();
h.audio.canplay();
await h.composed();
windowEvents.dispatchEvent(new Event('pagehide'));
const disposedNotifications = h.notifications;
h.audio.finishPlay();
await settle();
h.study.start();
h.study.dispose();
assert.equal(h.audio.paused, true);
assert.equal(h.view.frame, null);
assert.equal(h.notifications, disposedNotifications, 'pagehide disposes pending playback and listeners');

const invalid = harness();
invalid.study.start();
invalid.audio.metadata(41);
assert.equal(invalid.snapshot.phase, 'error');
assert.equal(invalid.snapshot.error, 'data');
assert.equal(invalid.view.locked, true);
assert.equal(invalid.audio.plays.length, 0);
invalid.study.play();
assert.equal(invalid.audio.plays.length, 0);
invalid.study.dispose();
await invalid.composed();
assert.equal(invalid.snapshot.phase, 'explore');
assert.equal(invalid.view.frame, null);
console.log('Study metadata boundaries, audio authority, retry, and cancellation assertions passed.');
