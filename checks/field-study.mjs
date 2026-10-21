import assert from 'node:assert/strict';
import { parseStudyVersion, validateRecordingDuration } from '../src/lib/viewer/study-data.ts';
import { createFieldStudy, evaluateStudyFrame } from '../src/lib/viewer/field-study.ts';
import { Box3, BoxGeometry, Color, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, OrthographicCamera, Scene, Vector3 } from 'three';
import { createScaleComparison } from '../src/lib/viewer/scale-comparison.ts';
import { anatomyRegionMeshes } from '../src/lib/viewer/anatomy-inspection.ts';
import { createStudyEmphasis } from '../src/lib/viewer/study-emphasis.ts';

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
const evaluatedFrame = { chapter: 'meet', worldProgress: 0, scaleProgress: -1, armorProgress: -1, region: 'tailClub', regionProgress: -1 };
evaluateStudyFrame(version, 9.999, evaluatedFrame);
assert.deepEqual(evaluatedFrame, { chapter: 'meet', worldProgress: 0, scaleProgress: 0, armorProgress: 0, region: 'armor', regionProgress: 0 });
evaluateStudyFrame(version, 10, evaluatedFrame);
assert.deepEqual(evaluatedFrame, { chapter: 'scale', worldProgress: 0, scaleProgress: 0, armorProgress: 0, region: 'armor', regionProgress: 0 });
evaluateStudyFrame(version, 10.375, evaluatedFrame);
assert.equal(evaluatedFrame.scaleProgress, 0.5);
evaluateStudyFrame(version, 19.999, evaluatedFrame);
assert.equal(evaluatedFrame.scaleProgress, 1);
assert.equal(evaluatedFrame.armorProgress, 0);
assert.deepEqual(evaluatedFrame, { chapter: 'scale', worldProgress: 0, scaleProgress: 1, armorProgress: 0, region: 'armor', regionProgress: 0 });
evaluateStudyFrame(version, 20, evaluatedFrame);
assert.equal(evaluatedFrame.armorProgress, 0);
assert.deepEqual(evaluatedFrame, { chapter: 'armor', worldProgress: 0, scaleProgress: 1, armorProgress: 0, region: 'armor', regionProgress: 0 });
evaluateStudyFrame(version, 20.375, evaluatedFrame);
assert.equal(evaluatedFrame.armorProgress, 0.5);
evaluateStudyFrame(version, 20.75, evaluatedFrame);
assert.equal(evaluatedFrame.armorProgress, 1);
evaluateStudyFrame(version, 25, evaluatedFrame);
assert.equal(evaluatedFrame.region, 'tailClub');
assert.equal(evaluatedFrame.regionProgress, 0);
evaluateStudyFrame(version, 25.375, evaluatedFrame);
assert.equal(evaluatedFrame.regionProgress, 0.5);
evaluateStudyFrame(version, 25.75, evaluatedFrame);
assert.equal(evaluatedFrame.regionProgress, 1);
evaluateStudyFrame(version, 29.999, evaluatedFrame);
assert.deepEqual(evaluatedFrame, { chapter: 'armor', worldProgress: 0, scaleProgress: 1, armorProgress: 1, region: 'tailClub', regionProgress: 1 });
evaluateStudyFrame(version, 30, evaluatedFrame);
assert.equal(evaluatedFrame.chapter, 'world');
assert.equal(evaluatedFrame.worldProgress, 0);
evaluateStudyFrame(version, 30.375, evaluatedFrame);
assert.equal(evaluatedFrame.worldProgress, 0.5);
evaluateStudyFrame(version, 39.999, evaluatedFrame);
assert.equal(evaluatedFrame.worldProgress, 1);
assert.throws(() => evaluateStudyFrame(version, 40, evaluatedFrame), RangeError);

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
  const composedFrames = [];
  let snapshot;
  let notifications = 0;
  const view = {
    locked: false, inspection: null, frame: null, exits: 0,
    begin: () => true,
    compose(frame) {
      this.locked = true;
      this.inspection = null;
      composedFrames.push({ ...frame });
      const pending = deferred();
      compositions.push(pending);
      return pending.promise;
    },
    present() {},
    freeze() { this.locked = true; },
    pause() { this.locked = false; },
    exit() { this.locked = false; this.inspection = null; ++this.exits; },
    setFrame(callback) { this.frame = callback; }
  };
  const study = createFieldStudy(version, view, (next) => { snapshot = next; ++notifications; }, audio);
  return {
    audio, view, study,
    get snapshot() { return snapshot; },
    get compositionCount() { return compositions.length; },
    get composedFrames() { return composedFrames; },
    get notifications() { return notifications; },
    async composed(index = compositions.length - 1) { compositions[index].resolve(true); await settle(); }
  };
}
const timeline = harness();
timeline.study.start();
timeline.audio.metadata();
timeline.audio.canplay();
await timeline.composed();
timeline.audio.finishPlay();
await settle();
timeline.audio.at(9.99);
timeline.view.frame();
assert.equal(timeline.snapshot.phase, 'playing', 'the study remains active before the Scale boundary');
assert.equal(timeline.snapshot.chapter, 'meet');
timeline.audio.at(10);
timeline.view.frame();
assert.equal(timeline.snapshot.phase, 'playing', 'Meet continues into Scale');
assert.equal(timeline.snapshot.chapter, 'scale', 'the exact chapter boundary selects Scale');
assert.equal(timeline.snapshot.caption, 'Scale caption');
timeline.study.pause();
const compositionsBeforeSeek = timeline.compositionCount;
timeline.audio.currentTime = 5;
assert.equal(timeline.compositionCount, compositionsBeforeSeek, 'native seeking waits for the resolved position');
assert.equal(timeline.snapshot.phase, 'seeking');
timeline.audio.finishSeek();
assert.equal(timeline.compositionCount, compositionsBeforeSeek + 1, 'settled seeking composes its final timestamp');
await timeline.composed();
assert.equal(timeline.snapshot.phase, 'paused');
assert.equal(timeline.snapshot.chapter, 'meet', 'backward seek removes the Scale chapter');
timeline.audio.currentTime = 26.5;
timeline.audio.finishSeek();
await timeline.composed();
assert.equal(timeline.snapshot.phase, 'paused', 'a paused Armor seek remains paused');
assert.equal(timeline.snapshot.chapter, 'armor');
assert.deepEqual(timeline.composedFrames.at(-1), { chapter: 'armor', worldProgress: 0, scaleProgress: 1, armorProgress: 1, region: 'tailClub', regionProgress: 1 });
timeline.audio.currentTime = 25;
timeline.audio.finishSeek();
await timeline.composed();
assert.equal(timeline.snapshot.chapter, 'armor', 'backward seek within Armor keeps the chapter');
assert.deepEqual(timeline.composedFrames.at(-1), { chapter: 'armor', worldProgress: 0, scaleProgress: 1, armorProgress: 1, region: 'tailClub', regionProgress: 0 });
timeline.audio.currentTime = 26.5;
timeline.audio.finishSeek();
await timeline.composed();
assert.deepEqual(timeline.composedFrames.at(-1), { chapter: 'armor', worldProgress: 0, scaleProgress: 1, armorProgress: 1, region: 'tailClub', regionProgress: 1 }, 'direct seek reconstructs the same Armor frame');
timeline.study.play();
await timeline.composed();
timeline.audio.finishPlay();
await settle();
assert.equal(timeline.snapshot.phase, 'playing', 'resume composes Scale before native playback advances');
timeline.audio.at(29.99);
timeline.view.frame();
assert.equal(timeline.snapshot.chapter, 'armor');
timeline.audio.at(30);
assert.equal(timeline.snapshot.chapter, 'world');
assert.equal(timeline.snapshot.caption, 'World caption');
timeline.study.pause();
const worldTime = timeline.snapshot.time;
timeline.view.frame();
assert.equal(timeline.snapshot.time, worldTime);
assert.equal(timeline.view.locked, false);
timeline.study.play();
assert.equal(timeline.audio.paused, true, 'world resume holds audio during composition');
await timeline.composed();
timeline.audio.finishPlay();
await settle();
timeline.audio.at(40);
assert.equal(timeline.snapshot.phase, 'explore', 'recording completion restores Explore');
assert.equal(timeline.view.exits, 1);
timeline.study.dispose();

const staleScaleCompose = harness();
staleScaleCompose.study.start();
staleScaleCompose.audio.metadata();
staleScaleCompose.audio.canplay();
await staleScaleCompose.composed();
staleScaleCompose.audio.finishPlay();
await settle();
staleScaleCompose.study.pause();
staleScaleCompose.audio.currentTime = 26.5;
staleScaleCompose.audio.finishSeek();
await staleScaleCompose.composed();
const scaleComposeIndex = staleScaleCompose.compositionCount - 1;
staleScaleCompose.study.exit();
await staleScaleCompose.composed(scaleComposeIndex);
assert.equal(staleScaleCompose.snapshot.phase, 'explore', 'a delayed Armor composition cannot restore an exited study');
assert.equal(staleScaleCompose.audio.paused, true);
staleScaleCompose.study.dispose();

const staleScalePlay = harness();
staleScalePlay.study.start();
staleScalePlay.audio.metadata();
staleScalePlay.audio.canplay();
await staleScalePlay.composed();
staleScalePlay.audio.finishPlay();
await settle();
staleScalePlay.audio.at(26.5);
staleScalePlay.view.frame();
staleScalePlay.study.pause();
staleScalePlay.study.play();
await staleScalePlay.composed();
const pendingScalePlay = staleScalePlay.audio.plays.length - 1;
staleScalePlay.study.pause();
staleScalePlay.audio.finishPlay(pendingScalePlay);
await settle();
assert.equal(staleScalePlay.snapshot.phase, 'paused');
assert.equal(staleScalePlay.snapshot.chapter, 'armor');
assert.equal(staleScalePlay.audio.paused, true, 'a delayed play cannot resume after Armor Pause');
staleScalePlay.study.dispose();


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
assert.equal(h.compositionCount, firstSeek, 'successive native seeking updates do not compose unsettled positions');
h.audio.finishSeek();
assert.equal(h.compositionCount, firstSeek + 1, 'only the final resolved native position is composed');
await h.composed(firstSeek);
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
h.audio.currentTime = 26.5;
h.audio.finishSeek();
await h.composed();
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
assert.equal(h.snapshot.phase, 'playing', 'Scale remains active at its chapter start');
assert.equal(h.snapshot.chapter, 'scale');
h.audio.at(20);
assert.equal(h.snapshot.phase, 'playing', 'Armor remains active at its chapter start');
assert.equal(h.snapshot.chapter, 'armor');
h.audio.at(30);
assert.equal(h.snapshot.chapter, 'world');
h.audio.at(40);
assert.equal(h.snapshot.phase, 'explore', 'the endpoint is recording completion');
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

const armorModel = new Group();
const armorGroup = new Group();
armorGroup.name = 'armorGroup';
const plateA = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color: '#777777' }));
const plateB = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: '#777777' }));
armorGroup.add(plateA, plateB);
const bodyMesh = new Mesh(
  new BoxGeometry(2, 4, 2),
  new MeshStandardMaterial({ color: '#777777' })
);
bodyMesh.name = 'bodyMesh';
const legMaterial = new MeshStandardMaterial({ color: '#777777' });
const legMesh = new Mesh(new BoxGeometry(1, 1, 1), legMaterial);
plateA.material = legMaterial;
const headGroup = new Group();
headGroup.name = 'headGroup';
const headMesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: '#777777' }));
headGroup.add(headMesh);
const clubMesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color: '#777777' }));
clubMesh.name = 'clubMesh';
armorModel.add(armorGroup, bodyMesh, legMesh, headGroup, clubMesh);
const regions = (id) => anatomyRegionMeshes(armorModel, id);
assert.deepEqual(regions('armor'), [plateA, plateB, bodyMesh], 'armor includes plates and upper-torso body mapping');
assert.deepEqual(regions('head'), [headMesh]);
assert.deepEqual(regions('tailClub'), [clubMesh]);
const unavailableArmorModel = new Group();
const unavailableBody = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
unavailableBody.name = 'bodyMesh';
unavailableArmorModel.add(unavailableBody);
assert.deepEqual(anatomyRegionMeshes(unavailableArmorModel, 'armor'), [], 'body mapping requires armor plate availability');

const emphasis = createStudyEmphasis(armorModel);
const originalMaterials = new Map(
  [plateA, plateB, bodyMesh, legMesh, headMesh, clubMesh].map((mesh) => [mesh, mesh.material])
);
const cloneDisposals = new Map();
const color = (mesh) => mesh.material.color.getHexString();
const amber = new Color('#d9a54d');
const dim = new Color('#26241f');
emphasis.apply('armor');
for (const mesh of [plateA, plateB, bodyMesh]) {
  assert.notEqual(mesh.material, originalMaterials.get(mesh));
  assert.equal(mesh.material.color.getHex(), originalMaterials.get(mesh).color.clone().lerp(amber, 0.35).getHex(), 'armor receives modest amber emphasis');
}
for (const mesh of [legMesh, headMesh, clubMesh]) {
  assert.notEqual(mesh.material, originalMaterials.get(mesh));
  assert.equal(color(mesh), originalMaterials.get(mesh).color.clone().lerp(dim, 0.45).getHexString());
}
assert.equal(legMaterial.color.getHexString(), '777777', 'a specimen leg sharing its source material remains untinted');
assert.notEqual(plateA.material, legMesh.material, 'shared source material receives per-mesh treatments');
const armorMaterials = [plateA, plateB, bodyMesh, legMesh, headMesh, clubMesh].map((mesh) => mesh.material);
emphasis.apply('armor');
assert.deepEqual([plateA, plateB, bodyMesh, legMesh, headMesh, clubMesh].map((mesh) => mesh.material), armorMaterials, 'reapplying the active region reuses its material clones');
for (const material of armorMaterials) {
  cloneDisposals.set(material, 0);
  material.addEventListener('dispose', () => cloneDisposals.set(material, cloneDisposals.get(material) + 1));
}
emphasis.apply('tailClub');
assert.notEqual(clubMesh.material, armorMaterials[5], 'tail club changes from dimmed to emphasized');
assert.equal(clubMesh.material.color.getHexString(), originalMaterials.get(clubMesh).color.clone().lerp(amber, 0.35).getHexString());
for (const mesh of [plateA, plateB, bodyMesh]) {
  assert.notEqual(mesh.material, armorMaterials[[plateA, plateB, bodyMesh, legMesh, headMesh, clubMesh].indexOf(mesh)], 'former region receives dim treatment');
  assert.equal(color(mesh), originalMaterials.get(mesh).color.clone().lerp(dim, 0.45).getHexString());
}
const tailMaterials = [plateA, plateB, bodyMesh, legMesh, headMesh, clubMesh].map((mesh) => mesh.material);
for (const material of tailMaterials) if (!cloneDisposals.has(material)) {
  cloneDisposals.set(material, 0);
  material.addEventListener('dispose', () => cloneDisposals.set(material, cloneDisposals.get(material) + 1));
}
emphasis.clear();
for (const [mesh, material] of originalMaterials) assert.equal(mesh.material, material, 'clear restores exact original material reference');
emphasis.apply('armor');
emphasis.apply('armor');
emphasis.clear();
emphasis.clear();
emphasis.apply('tailClub');
const finalClones = [plateA, plateB, bodyMesh, legMesh, headMesh, clubMesh].map((mesh) => mesh.material);
for (const material of finalClones) if (!cloneDisposals.has(material)) {
  cloneDisposals.set(material, 0);
  material.addEventListener('dispose', () => cloneDisposals.set(material, cloneDisposals.get(material) + 1));
}
emphasis.dispose();
emphasis.dispose();
assert.ok([...cloneDisposals.values()].every((count) => count === 1), 'each owned clone is disposed exactly once');
for (const [mesh, material] of originalMaterials) assert.equal(mesh.material, material);

assert.equal(invalid.view.frame, null);
const specimenWrapper = new Group();
const specimenMesh = new Mesh(
  new BoxGeometry(9.05, 2.5, 3.5),
  new MeshStandardMaterial({ color: '#777777' })
);
specimenMesh.position.set(2, 6.5, -2);
specimenWrapper.add(specimenMesh);
specimenWrapper.updateWorldMatrix(true, true);
const sourceBounds = new Box3().setFromObject(specimenWrapper, true);
let projection;
let projectionCount = 0;
const comparison = createScaleComparison(sourceBounds, [specimenMesh], (next) => {
  projection = next;
  ++projectionCount;
});
const origin = comparison.origin;
assert.equal(origin.x, 2);
assert.equal(origin.y, sourceBounds.min.y);
assert.equal(origin.z, -2);
assert.ok(Number.isFinite(comparison.factor) && comparison.factor > 0);
const calibratedMinX = origin.x + comparison.factor * (sourceBounds.min.x - origin.x);
const calibratedMaxX = origin.x + comparison.factor * (sourceBounds.max.x - origin.x);
assert.ok(Math.abs(calibratedMaxX - calibratedMinX - 8) < 1e-6, 'loaded head-to-tail extent calibrates to 8 m');
const calibratedMinY = origin.y + comparison.factor * (sourceBounds.min.y - origin.y);
const guide = comparison.root.getObjectByName('length-guide');
assert.ok(guide, 'generated guide is available for measured endpoint assertions');
const guidePositions = guide.geometry.getAttribute('position');
assert.ok(Math.abs(guidePositions.getX(0) - calibratedMinX) < 1e-6);
assert.ok(Math.abs(guidePositions.getX(1) - calibratedMaxX) < 1e-6);
assert.ok(Math.abs(guidePositions.getY(0) - (calibratedMinY + 0.03)) < 1e-6);
const human = comparison.root.getObjectByName('human-reference');
assert.ok(human, 'generated human silhouette exists');
const humanBounds = new Box3().setFromObject(human, true);
assert.ok(Math.abs((humanBounds.max.y - humanBounds.min.y) - 1.7) < 1e-6);
assert.ok(Math.abs(humanBounds.min.y - calibratedMinY) < 1e-6, 'silhouette feet share the specimen ground');
const calibratedMaxZ = origin.z + comparison.factor * (sourceBounds.max.z - origin.z);
assert.ok(Math.abs(humanBounds.min.z - calibratedMaxZ - 0.6) < 1e-6, 'human stands 0.6 m beyond the specimen');
assert.ok(Math.abs(guidePositions.getZ(0) - humanBounds.max.z - 0.35) < 1e-6, 'guide sits 0.35 m beyond the silhouette');
assert.throws(() => createScaleComparison(
  new Box3(new Vector3(1, 2, 3), new Vector3(1, 4, 5)),
  [specimenMesh],
  () => {}
), RangeError, 'zero head-to-tail extent is rejected');

const scene = new Scene();
scene.add(specimenWrapper, comparison.root);
specimenWrapper.scale.setScalar(comparison.factor);
specimenWrapper.position.copy(origin).multiplyScalar(1 - comparison.factor);
specimenWrapper.updateWorldMatrix(true, true);
comparison.setVisible(true);
const camera = new OrthographicCamera(-7, 7, 3, -3, 0.1, 100);
const fitCenter = comparison.bounds.getCenter(new Vector3());
camera.position.set(fitCenter.x, fitCenter.y, fitCenter.z + 25);
camera.lookAt(fitCenter);
camera.updateMatrixWorld(true);
comparison.update(camera, 1400, 600);
assert.equal(projection.visible, true);
assert.equal(projection.length.visible, true);
assert.equal(projection.human.visible, true);
camera.left = -0.1;
camera.right = 0.1;
camera.top = 0.1;
camera.bottom = -0.1;
camera.updateProjectionMatrix();
comparison.update(camera, 1400, 600);
assert.equal(projection.length.visible, false, 'off-frustum guide anchors are hidden');
assert.equal(projection.human.visible, false, 'off-frustum human anchors are hidden');
camera.left = -7;
camera.right = 7;
camera.top = 3;
camera.bottom = -3;
camera.updateProjectionMatrix();
camera.position.set(fitCenter.x, calibratedMinY + 1, fitCenter.z - 25);
camera.lookAt(fitCenter.x, calibratedMinY + 1, fitCenter.z);
camera.updateMatrixWorld(true);
comparison.update(camera, 1400, 600);
assert.equal(projection.length.visible, false, 'a nearer specimen surface hides the guide anchor');
assert.equal(projection.human.visible, false, 'a nearer specimen surface hides the human anchor');
const guideAnchor = new Vector3(guidePositions.getX(0), guidePositions.getY(0), guidePositions.getZ(0));
const nearEdgeTargetY = guideAnchor.y - 2.8;
camera.position.set(guideAnchor.x, nearEdgeTargetY, guideAnchor.z + 25);
camera.lookAt(guideAnchor.x, nearEdgeTargetY, guideAnchor.z);
camera.updateMatrixWorld(true);
comparison.update(camera, 1400, 600);
assert.equal(projection.length.visible, false, 'an anchor whose offset badge would leave the stage is hidden');
const beforeHidden = projectionCount;
comparison.setVisible(false);
assert.equal(projectionCount, beforeHidden + 1, 'hiding publishes the changed projection immediately');
assert.equal(projection.visible, false);
assert.equal(projection.length.visible, false);
assert.equal(projection.human.visible, false);

const ownedResources = [];
comparison.root.traverse((object) => {
  const geometry = object.geometry;
  if (geometry) ownedResources.push(geometry);
  const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
  ownedResources.push(...materials);
});
const disposedResources = new Map();
for (const resource of new Set(ownedResources)) {
  disposedResources.set(resource, 0);
  resource.addEventListener('dispose', () => disposedResources.set(resource, disposedResources.get(resource) + 1));
}
let specimenDisposals = 0;
specimenMesh.geometry.addEventListener('dispose', () => ++specimenDisposals);
specimenMesh.material.addEventListener('dispose', () => ++specimenDisposals);
comparison.dispose();
comparison.dispose();
assert.equal(comparison.root.parent, null);
assert.ok([...disposedResources.values()].every((count) => count === 1), 'owned geometry and materials dispose exactly once');
assert.equal(specimenDisposals, 0, 'comparison cleanup never disposes specimen resources');
console.log('Study timeline, calibrated geometry, projection, and lifetime assertions passed.');
console.log('Study metadata boundaries, audio authority, retry, and cancellation assertions passed.');
