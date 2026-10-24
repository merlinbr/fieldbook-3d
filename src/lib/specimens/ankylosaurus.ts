import { PUBLIC_ANKYLOSAURUS_MODEL_URL, PUBLIC_ANKYLOSAURUS_STUDY_VERSION, PUBLIC_ANKYLOSAURUS_STUDY_VERSION_DE } from '$app/env/public';
import type { AnatomyText } from './specimen-config.ts';
import { createAnkylosaurusConfig } from './ankylosaurus-config.ts';
import { resolveStudyVersion } from '../viewer/study-data.ts';

const development = import.meta.env.MODE === 'development';
const configuredUrl = PUBLIC_ANKYLOSAURUS_MODEL_URL;

function modelUrl(): string {
  const value = configuredUrl ?? (development ? 'http://127.0.0.1:5194/ankylosaurus.glb' : undefined);
  const requirement = 'Set PUBLIC_ANKYLOSAURUS_MODEL_URL to an absolute HTTP(S) URL without credentials. Production requires externally hosted media; for a local static smoke build, use --mode development.';

  if (!value) throw new Error(requirement);

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(requirement);
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error(requirement);
  }

  const hostname = url.hostname.replace(/\.$/, '');
  const loopback = hostname === 'localhost' || hostname.endsWith('.localhost') ||
    hostname.startsWith('127.') || hostname === '[::1]' ||
    /^\[::ffff:7f[\da-f]{2}:[\da-f]{1,4}\]$/.test(hostname);

  if (!development && loopback) throw new Error(requirement);
  return url.href;
}

const study = {
  en: resolveStudyVersion('en', PUBLIC_ANKYLOSAURUS_STUDY_VERSION, PUBLIC_ANKYLOSAURUS_STUDY_VERSION_DE),
  de: resolveStudyVersion('de', PUBLIC_ANKYLOSAURUS_STUDY_VERSION, PUBLIC_ANKYLOSAURUS_STUDY_VERSION_DE)
};

export const ankylosaurus = {
  id: 'ankylosaurus',
  scientificName: 'Ankylosaurus magniventris',
  config: createAnkylosaurusConfig(modelUrl()),
  study,
  versions: Object.values(study).map((recording) => recording.version).filter((version) => version !== null)
} as const;

export const ankylosaurusText = {
  en: {
    viewerLabel: 'Interactive 3D Ankylosaurus specimen',
    name: 'Ankylosaurus',
    description: 'An armored dinosaur with a distinctive tail club.',
    reconstruction: 'A stylized reconstruction.',
    anatomy: {
      armor: { label: 'Armor', heading: 'Bone-built armor', body: 'Bony plates called osteoderms formed within the skin. They probably helped protect Ankylosaurus like a suit of armor.' },
      head: { label: 'Head', heading: 'Built for eating plants', body: 'Ankylosaurus had a beak at the front of its mouth and small teeth behind it. Despite its tough appearance, it was a plant-eater.' },
      tailClub: { label: 'Tail club', heading: 'A powerful defense', body: 'A large bony knob formed the end of the tail. Scientists think Ankylosaurus could swing it to strike an attacker.' }
    } satisfies AnatomyText
  },
  de: {
    viewerLabel: 'Interaktives 3D-Exemplar eines Ankylosaurus',
    name: 'Ankylosaurus',
    description: 'Ein gepanzerter Dinosaurier mit einer markanten Schwanzkeule.',
    reconstruction: 'Eine stilisierte Rekonstruktion.',
    anatomy: {
      armor: { label: 'Panzerung', heading: 'Ein Panzer aus Knochen', body: 'Knochenplatten, die Osteoderme heißen, bildeten sich in der Haut. Sie schützten Ankylosaurus vermutlich wie eine Rüstung.' },
      head: { label: 'Kopf', heading: 'Für Pflanzenkost gebaut', body: 'Ankylosaurus hatte vorne am Maul einen Schnabel und dahinter kleine Zähne. Trotz seines wehrhaften Aussehens war er ein Pflanzenfresser.' },
      tailClub: { label: 'Schwanzkeule', heading: 'Eine starke Verteidigung', body: 'Am Schwanzende saß eine große Verdickung aus Knochen. Forschende vermuten, dass Ankylosaurus sie schwingen konnte, um einen Angreifer zu treffen.' }
    } satisfies AnatomyText
  }
} as const;
