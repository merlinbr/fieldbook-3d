import assert from 'node:assert/strict';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, OrthographicCamera } from 'three';
import { createAnatomyInspection } from '../src/lib/viewer/anatomy-inspection.ts';

// Only the DOM event adapter is simulated; geometry, camera, and picking are real.
const previousWindow = globalThis.window;
const previousDocument = globalThis.document;
const canvas = new EventTarget();
canvas.style = { cursor: '', removeProperty(name) { delete this[name]; } };
canvas.getBoundingClientRect = () => ({ left: 0, top: 0, right: 800, bottom: 800, width: 800, height: 800 });
globalThis.window = new EventTarget();
globalThis.document = Object.assign(new EventTarget(), { hidden: false, elementFromPoint: () => canvas });
const model = new Group();
const material = new MeshStandardMaterial();
const body = new Mesh(new BoxGeometry(4, 4, 2), material);
body.name = 'bodyMesh';
model.add(body);
const armor = new Group();
armor.name = 'armorGroup';
for (const x of [-1, 1]) {
  const plate = new Mesh(new BoxGeometry(0.6, 0.6, 0.3), material);
  plate.position.set(x, 1, 1.1);
  armor.add(plate);
}
model.add(armor);
const head = new Group();
head.name = 'headGroup';
// A head mesh behind the lower torso must not be picked through the body.
const hiddenHead = new Mesh(new BoxGeometry(0.6, 0.6, 0.3), material);
hiddenHead.position.set(0, -1, -2);
head.add(hiddenHead);
model.add(head);
const camera = new OrthographicCamera(-4, 4, 4, -4, 0.1, 100);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);
let snapshot;
let inspection;
function pointer(type, x, y) {
  const event = Object.assign(new Event(type), { pointerId: 1, pointerType: 'mouse', button: 0, clientX: x, clientY: y });
  Object.defineProperty(event, 'target', { value: canvas });
  window.dispatchEvent(event);
}
function click(x, y) { pointer('pointerdown', x, y); pointer('pointerup', x, y); }
try {
  inspection = createAnatomyInspection(model, camera, canvas, (next) => { snapshot = next; });
  inspection.update(800, 800);
  for (const x of [300, 400, 500, 400]) {
    pointer('pointermove', x, 300);
    assert.equal(snapshot.hovered, 'armor', 'plate-to-gap traversal stays Armor');
    assert.equal(canvas.style.cursor, 'pointer');
  }
  click(400, 300);
  assert.equal(snapshot.selected, 'armor', 'a pointer over a plate gap opens Armor');
  inspection.select('head');
  pointer('pointermove', 400, 500);
  assert.equal(snapshot.hovered, null, 'lower torso is not an armor hotspot');
  click(400, 500);
  assert.equal(snapshot.selected, 'head', 'lower body preserves selection and blocks the hidden head');
  pointer('pointermove', 400, 400);
  assert.equal(snapshot.hovered, 'armor', 'torso midline belongs to the upper region');
  pointer('pointermove', 400, 401);
  assert.equal(snapshot.hovered, null, 'below the midline remains non-selectable');
  model.position.y = 1;
  inspection.update(800, 800);
  pointer('pointermove', 400, 350);
  assert.equal(snapshot.hovered, null, 'body classification uses local height, not world height');
  pointer('pointermove', 400, 250);
  assert.equal(snapshot.hovered, 'armor', 'transformed upper torso remains clickable');
  inspection.setEnabled(false);
  pointer('pointermove', 400, 250);
  click(400, 250);
  assert.equal(snapshot.hovered, null);
  assert.equal(snapshot.selected, null, 'guided ownership prevents gap selection');
  assert.equal(canvas.style.cursor, 'default');
  inspection.dispose();
  model.remove(armor);
  inspection = createAnatomyInspection(model, camera, canvas, (next) => { snapshot = next; });
  inspection.update(800, 800);
  pointer('pointermove', 400, 250);
  assert.equal(snapshot.hovered, null, 'missing armor does not turn the body into a substitute target');
  click(400, 250);
  assert.equal(snapshot.selected, null);
  console.log('Anatomy plate-gap continuity, body boundaries, transforms, and ownership assertions passed.');
} finally {
  inspection?.dispose();
  model.traverse((object) => { if (object instanceof Mesh) object.geometry.dispose(); });
  armor.traverse((object) => { if (object instanceof Mesh) object.geometry.dispose(); });
  material.dispose();
  if (previousWindow === undefined) delete globalThis.window;
  else globalThis.window = previousWindow;
  if (previousDocument === undefined) delete globalThis.document;
  else globalThis.document = previousDocument;
}
