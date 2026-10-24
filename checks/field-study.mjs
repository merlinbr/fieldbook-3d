import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseStudyVersion, validateRecordingDuration } from '../src/lib/viewer/study-data.ts';
import * as studyData from '../src/lib/viewer/study-data.ts';
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
assert.equal(parse({ ...data, language: 'de' }).error, null, 'German recordings retain independent complete metadata');
const { version, error } = parse(data);
assert.equal(error, null);
assert.ok(version);
assert.equal(typeof studyData.resolveStudyVersion, 'function', 'resolve a complete version for the document language');
const germanData = {
  ...data, id: 'german-boundary-check', language: 'de', duration: 48,
  chapters: data.chapters.map((chapter) => ({ ...chapter, start: chapter.start * 1.2 })),
  cues: data.cues.map((cue) => ({ ...cue, start: cue.start * 1.2, end: cue.end * 1.2 })),
  captions: data.captions.map((cue) => ({ ...cue, start: cue.start * 1.2, end: cue.end * 1.2 }))
};
const englishRaw = JSON.stringify(data);
const germanRaw = JSON.stringify(germanData);
assert.equal(studyData.resolveStudyVersion('de', englishRaw, undefined).version.id, 'boundary-check');
assert.equal(studyData.resolveStudyVersion('de', englishRaw, germanRaw).version.duration, 48);
assert.equal(studyData.resolveStudyVersion('en', englishRaw, germanRaw).version.duration, 40);
assert.equal(studyData.resolveStudyVersion('de', englishRaw, '{').error, 'data', 'configured invalid German data is explicit');
assert.equal(studyData.resolveStudyVersion('de', englishRaw, englishRaw).error, 'data', 'German configuration cannot relabel English');
assert.equal(studyData.resolveStudyVersion('en', germanRaw, undefined).error, 'data');
assert.equal(studyData.resolveStudyVersion('de', englishRaw, JSON.stringify({ ...germanData, id: data.id })).error, 'data', 'different recordings require distinct identities');
const handoff = await import('../src/lib/viewer/study-handoff.ts').catch(() => null);
assert.ok(handoff, 'validated destination-link handoffs are supported');
const sourceContext = {
  specimen: 'ankylosaurus', version: version.id, time: 27.125, chapter: 'armor', captions: false,
  view: { azimuth: -0.7, polar: 1.1, zoom: 1.2 }
};
const germanVersion = parse(germanData).version;
const encoded = handoff.encodeStudyHandoff(sourceContext);
assert.ok(encoded.length < 1024);
assert.equal(handoff.parseStudyHandoff(encoded, [version, germanVersion], version).time, 27.125);
const mapped = handoff.parseStudyHandoff(encoded, [version, germanVersion], germanVersion);
assert.equal(mapped.time, 24, 'different recording selects corresponding chapter start, never proportional time');
assert.equal(mapped.captions, false);
assert.deepEqual(mapped.view, sourceContext.view);
for (const change of [
  { specimen: 'other' }, { version: 'unknown' }, { time: -1 }, { time: 40.01 }, { time: '27' },
  { time: null }, { chapter: 'world' }, { captions: 'false' }, { captions: 0 },
  { view: { ...sourceContext.view, zoom: 99 } }, { view: { ...sourceContext.view, polar: 0 } },
  { view: { ...sourceContext.view, azimuth: 9 } }, { view: null }
]) assert.equal(handoff.parseStudyHandoff(JSON.stringify({ ...sourceContext, ...change }), [version, germanVersion], germanVersion), null);
assert.equal(handoff.parseStudyHandoff('{', [version], version), null);
assert.equal(handoff.parseStudyHandoff(' '.repeat(1025), [version], version), null);
const endpointContext = { ...sourceContext, time: 40, chapter: 'world' };
assert.equal(handoff.parseStudyHandoff(JSON.stringify(endpointContext), [version], version).time, 40);
// Published metadata is checked as well as boundary inputs; these assertions do not replace real-media acceptance.
const realEnglish = parseStudyVersion(readFileSync(new URL('../docs/assets/ankylosaurus-narration.en.json', import.meta.url), 'utf8')).version;
const realGerman = parseStudyVersion(readFileSync(new URL('../docs/assets/ankylosaurus-narration.de.json', import.meta.url), 'utf8')).version;
assert.ok(realEnglish && realGerman);
assert.equal(realGerman.duration, 52.4015);
assert.equal(handoff.parseStudyHandoff(JSON.stringify({ ...sourceContext, version: realEnglish.id, time: 42, chapter: 'world' }), [realEnglish, realGerman], realGerman).time, 40.51591836734694);
assert.equal(handoff.parseStudyHandoff(JSON.stringify({ ...sourceContext, version: realGerman.id, time: 42, chapter: 'world' }), [realEnglish, realGerman], realEnglish).time, 39.053061224489795);
assert.equal(parseStudyVersion(undefined).error, 'missing');
assert.equal(parseStudyVersion(' ').error, 'missing');
assert.equal(parseStudyVersion('{').error, 'data');
for (const change of [
  { language: 'fr' }, { duration: 29 }, { duration: 61 }, { provenance: {} },
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
evaluateStudyFrame(version, 40, evaluatedFrame);
assert.equal(evaluatedFrame.chapter, 'world', 'the paused endpoint retains the final World view');
assert.equal(evaluatedFrame.worldProgress, 1);
assert.throws(() => evaluateStudyFrame(version, 40.001, evaluatedFrame), RangeError);

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

function harness(recording = version) {
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
  const study = createFieldStudy(recording, view, (next) => { snapshot = next; ++notifications; }, audio);
  return {
    audio, view, study,
    get snapshot() { return snapshot; },
    get compositionCount() { return compositions.length; },
    get composedFrames() { return composedFrames; },
    get notifications() { return notifications; },
    async composed(index = compositions.length - 1) { compositions[index].resolve(true); await settle(); }
  };
}

const restored = harness();
assert.equal(typeof restored.study.restore, 'function', 'handoff restoration enters paused without calling Play');
assert.equal(restored.study.restore({ time: 27.125, captions: false }), true);
assert.equal(restored.snapshot.requestedPlaying, false);
assert.equal(restored.snapshot.captionsEnabled, false);
restored.audio.metadata();
restored.audio.canplay();
restored.audio.finishSeek();
await restored.composed();
assert.equal(restored.snapshot.phase, 'paused');
assert.equal(restored.snapshot.time, 27.125);
assert.equal(restored.snapshot.chapter, 'armor');
assert.equal(restored.audio.plays.length, 0);
restored.study.play();
await restored.composed();
restored.audio.finishPlay();
await settle();
restored.audio.at(28.25);
assert.deepEqual(restored.study.transfer(), { time: 28.25, chapter: 'armor', captions: false });
assert.equal(restored.snapshot.phase, 'leaving');
assert.equal(restored.audio.src, '', 'old document unloads media before navigation begins');
restored.study.play();
restored.audio.canplay();
assert.equal(restored.audio.plays.length, 1, 'leaving cannot start another play');
restored.study.dispose();
const transferLoading = harness();
transferLoading.study.start();
transferLoading.study.seek(31);
assert.deepEqual(transferLoading.study.transfer(), { time: 31, chapter: 'world', captions: true });
transferLoading.audio.metadata();
await transferLoading.composed(0);
assert.equal(transferLoading.snapshot.phase, 'leaving', 'stale readiness/composition cannot restart navigation');
assert.equal(transferLoading.audio.plays.length, 0);
transferLoading.study.dispose();
const invalidRestore = harness();
assert.equal(invalidRestore.study.restore({ time: Infinity, captions: true }), false);
assert.equal(invalidRestore.study.restore({ time: 41, captions: true }), false);
assert.equal(invalidRestore.snapshot.active, false);
invalidRestore.study.dispose();

// Relative skips must accumulate pending commands and preserve playback intent.
const skips = harness();
assert.equal(typeof skips.study.skip, 'function', 'the controller supports relative time skips');
skips.study.start();
skips.study.skip(5);
skips.study.skip(5);
skips.study.skip(-5);
skips.study.pause();
skips.audio.metadata();
skips.audio.canplay();
assert.equal(skips.audio.currentTime, 5, 'rapid skips before metadata accumulate from the pending target');
skips.audio.finishSeek();
await skips.composed();
assert.equal(skips.snapshot.phase, 'paused');
assert.equal(skips.snapshot.time, 5);
skips.study.skip(5);
skips.study.skip(5);
skips.audio.finishSeek();
await skips.composed();
assert.equal(skips.snapshot.time, 15, 'rapid paused skips use the pending target, not the last published time');
assert.equal(skips.snapshot.chapter, 'scale');
assert.equal(skips.snapshot.caption, 'Scale caption');
assert.equal(skips.snapshot.requestedPlaying, false);
skips.audio.position = 13.25;
skips.study.skip(-5);
skips.audio.finishSeek();
await skips.composed();
assert.equal(skips.snapshot.time, 8.25, 'a skip samples the current media position between published updates');
assert.equal(skips.snapshot.chapter, 'meet');
skips.study.skip(100);
skips.audio.finishSeek();
await skips.composed();
assert.equal(skips.snapshot.time, 40, 'forward skips clamp at the endpoint');
assert.equal(skips.snapshot.active, true, 'paused endpoint remains available for inspection');
skips.study.skip(-100);
skips.audio.finishSeek();
await skips.composed();
assert.equal(skips.snapshot.time, 0, 'backward skips clamp at the start');
skips.study.skip(NaN);
skips.study.skip(Infinity);
assert.equal(skips.snapshot.phase, 'paused', 'invalid skip amounts cannot disturb playback');
skips.study.play();
await skips.composed();
skips.audio.finishPlay();
await settle();
skips.audio.position = 9;
skips.study.skip(5);
skips.audio.finishSeek();
await skips.composed();
skips.audio.finishPlay();
await settle();
assert.equal(skips.snapshot.time, 14);
assert.equal(skips.snapshot.phase, 'playing', 'playing skips resume after composing the destination');
assert.equal(skips.snapshot.requestedPlaying, true);
skips.study.skip(100);
skips.audio.finishSeek();
assert.equal(skips.snapshot.active, false, 'skipping past the end while playing completes the study');
skips.study.dispose();

// Public navigation commands exercise the controller, not a copy of its timeline.
const navigation = harness();
navigation.study.start();
navigation.study.seek(30.375);
navigation.study.seek(25.375);
navigation.study.pause();
navigation.audio.metadata();
navigation.audio.canplay();
assert.equal(navigation.audio.currentTime, 25.375, 'latest pre-metadata seek wins');
navigation.audio.finishSeek();
await navigation.composed();
assert.equal(navigation.snapshot.phase, 'paused');
assert.equal(navigation.snapshot.time, 25.375);
assert.equal(navigation.composedFrames.at(-1).regionProgress, 0.5);
assert.equal(navigation.audio.plays.length, 0, 'Pause during loading prevents later playback');
navigation.audio.position = 9.9995;
navigation.study.pause();
navigation.study.seek(10);
assert.equal(navigation.audio.currentTime, 10, 'nearby seeks must still assign the exact chapter start');
navigation.audio.finishSeek();
await navigation.composed();
assert.equal(navigation.snapshot.chapter, 'scale');
navigation.study.seek(25.375);
navigation.audio.finishSeek();
await navigation.composed();
navigation.study.moveChapter(-1);
navigation.audio.finishSeek();
await navigation.composed();
assert.equal(navigation.snapshot.time, 10, 'Previous selects the previous chapter, not the current start');
assert.equal(navigation.snapshot.caption, 'Scale caption');
navigation.study.moveChapter(1);
navigation.study.moveChapter(1);
navigation.audio.finishSeek();
await navigation.composed();
assert.equal(navigation.snapshot.time, 30, 'rapid Next commands use the latest requested chapter');
for (const target of [30.375, 10.375, 20, 25, 0, 40]) {
  navigation.view.inspection = 'head';
  navigation.study.seek(target);
  navigation.audio.finishSeek();
  await navigation.composed();
  evaluateStudyFrame(version, target, evaluatedFrame);
  assert.deepEqual(navigation.composedFrames.at(-1), evaluatedFrame, 'direct/backward reconstruction matches the timeline');
  assert.equal(navigation.view.inspection, null);
  assert.equal(navigation.snapshot.phase, 'paused');
  const count = navigation.compositionCount;
  navigation.view.inspection = 'armor';
  navigation.view.frame();
  navigation.audio.canplay();
  assert.equal(navigation.compositionCount, count, 'late readiness cannot recompose paused manual framing');
  assert.equal(navigation.view.inspection, 'armor');
}
assert.equal(navigation.snapshot.chapter, 'world');
assert.equal(navigation.snapshot.caption, '', 'caption intervals exclude their endpoint');
navigation.study.setCaptions(false);
assert.equal(navigation.snapshot.active, true, 'caption toggle at paused endpoint must not exit');
navigation.study.play();
assert.equal(navigation.snapshot.active, false, 'Play at the endpoint returns to Explore');
navigation.study.start();
navigation.audio.metadata();
navigation.audio.canplay();
await navigation.composed();
navigation.audio.finishPlay();
await settle();
navigation.study.seek(30.375);
assert.equal(navigation.snapshot.time, 0, 'unsettled seeks cannot advance presentation');
navigation.audio.finishSeek();
const staleComposition = navigation.compositionCount - 1;
navigation.study.seek(10.375);
await navigation.composed(staleComposition);
assert.equal(navigation.audio.plays.length, 1, 'obsolete seek composition cannot start audio');
navigation.audio.finishSeek();
await navigation.composed();
navigation.study.pause();
navigation.audio.finishPlay();
await settle();
assert.equal(navigation.audio.paused, true, 'Pause cancels playback promised by seeking');
navigation.study.play();
navigation.study.seek(20);
navigation.study.exit();
const exited = navigation.notifications;
navigation.audio.finishSeek();
await navigation.composed();
assert.equal(navigation.notifications, exited, 'Exit detaches pending seek callbacks');
navigation.study.dispose();
const naturalEnd = harness();
naturalEnd.study.start();
naturalEnd.audio.metadata();
naturalEnd.audio.canplay();
await naturalEnd.composed();
naturalEnd.audio.finishPlay();
await settle();
naturalEnd.audio.position = 40;
naturalEnd.audio.paused = true;
naturalEnd.audio.ended = true;
for (const event of ['timeupdate', 'pause', 'ended']) naturalEnd.audio.emit(event);
assert.equal(naturalEnd.snapshot.phase, 'explore', 'native completion pauses the element before queued timeupdate/pause/ended events');
naturalEnd.study.dispose();
const fractionalStart = 10.123456789123456;
const precise = harness(parse({ ...data, chapters: data.chapters.map((chapter, index) =>
  index === 1 ? { ...chapter, start: fractionalStart } : chapter
) }).version);
const positionDescriptor = Object.getOwnPropertyDescriptor(MediaProbe.prototype, 'currentTime');
Object.defineProperty(precise.audio, 'currentTime', {
  get() { return Math.floor(this.position * 1e6) / 1e6; },
  set(value) { positionDescriptor.set.call(this, value); }
});
precise.study.start();precise.audio.metadata();precise.audio.canplay();
await precise.composed();precise.study.pause();
precise.study.seek(fractionalStart);precise.audio.finishSeek();await precise.composed();
assert.equal(precise.snapshot.chapter, 'scale', 'microsecond native precision must not select the previous chapter');
assert.equal(precise.snapshot.time, fractionalStart, 'retain the resolved command at a quantized media boundary');
precise.study.seek(Number(fractionalStart.toPrecision(15)));
precise.audio.finishSeek();await precise.composed();
assert.equal(precise.snapshot.chapter, 'scale', 'native range serialization must preserve exact chapter starts');
precise.study.play();await precise.composed();precise.audio.finishPlay();await settle();
assert.equal(precise.snapshot.chapter, 'scale', 'resume must preserve the resolved boundary until media advances');
precise.study.dispose();
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
