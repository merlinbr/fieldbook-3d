import { resolveModelUrl } from './model-url.ts';

export function resolvePosterUrl(configuredUrl: string | undefined, options: {
  development: boolean; environmentVariable: string; developmentUrl: string;
}): string | null {
  const value = configuredUrl || undefined;
  if (value === undefined && !options.development) return null;
  return resolveModelUrl(value, options);
}
