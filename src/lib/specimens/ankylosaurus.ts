import { PUBLIC_ANKYLOSAURUS_MODEL_URL } from '$app/env/public';

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

export const ankylosaurus = {
  id: 'ankylosaurus',
  scientificName: 'Ankylosaurus magniventris',
  modelUrl: modelUrl()
} as const;

export const ankylosaurusText = {
  en: {
    name: 'Ankylosaurus',
    description: 'An armored dinosaur with a distinctive tail club.',
    reconstruction: 'A stylized reconstruction.'
  },
  de: {
    name: 'Ankylosaurus',
    description: 'Ein gepanzerter Dinosaurier mit einer markanten Schwanzkeule.',
    reconstruction: 'Eine stilisierte Rekonstruktion.'
  }
} as const;
