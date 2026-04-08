import { describe, expect, it } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPackageVersion } from '../src/lib/package-version.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..');

describe('getPackageVersion', () => {
  it('matches the repository package.json version', async () => {
    const packageJson = await fs.readJSON(path.join(PACKAGE_ROOT, 'package.json')) as { version: string };
    expect(getPackageVersion()).toBe(packageJson.version);
  });
});
