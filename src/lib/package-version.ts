import { readFileSync } from 'node:fs';

interface PackageManifest {
  version?: string;
}

export function getPackageVersion(): string {
  try {
    const raw = readFileSync(new URL('../../package.json', import.meta.url), 'utf-8');
    const manifest = JSON.parse(raw) as PackageManifest;
    return typeof manifest.version === 'string' && manifest.version.trim().length > 0
      ? manifest.version
      : '0.0.0';
  } catch {
    return '0.0.0';
  }
}
