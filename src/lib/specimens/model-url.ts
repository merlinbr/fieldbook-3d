export function resolveModelUrl(configuredUrl: string | undefined, options: Readonly<{
  development: boolean; environmentVariable: string; developmentUrl: string;
}>): string {
  const value = configuredUrl ?? (options.development ? options.developmentUrl : undefined);
  const requirement = `Set ${options.environmentVariable} to an absolute HTTP(S) URL without credentials. Production requires externally hosted media; for a local static smoke build, use --mode development.`;
  if (!value) throw new Error(requirement);

  let url: URL;
  try { url = new URL(value); }
  catch { throw new Error(requirement); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(requirement);

  const hostname = url.hostname.replace(/\.$/, '');
  const loopback = hostname === 'localhost' || hostname.endsWith('.localhost') ||
    hostname.startsWith('127.') || hostname === '[::1]' ||
    /^\[::ffff:7f[\da-f]{2}:[\da-f]{1,4}\]$/.test(hostname);
  if (!options.development && loopback) throw new Error(requirement);
  return url.href;
}
