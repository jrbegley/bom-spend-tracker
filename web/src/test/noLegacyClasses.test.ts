import { it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Guards the phase 5a token rename: none of the retired token names may appear in source.
// Matches the name anywhere in a class token (including after a variant or a '-', e.g. `hover:bg-accent-hover`).
const LEGACY = /\b(?:text-text(?:-secondary|-muted)?|accent-hover|accent-tint|text-accent|bg-accent|border-accent|bg-surface|bg-bg|border-rule|divide-rule|bg-rule|group-row|warn-tint|text-reject|savings-tint|savings-border|ppv-bar|rounded-(?:card|input|nav|chip))(?![\w-])/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(ts|tsx)$/.test(f) && !f.includes(' 2') && !p.endsWith('noLegacyClasses.test.ts') ? [p] : [];
  });
}

it('no retired token class names remain in src', () => {
  const src = fileURLToPath(new URL('..', import.meta.url));
  const hits = files(src).flatMap((f) => readFileSync(f, 'utf8').split('\n')
    .map((line, i) => (LEGACY.test(line) ? `${f.slice(src.length)}:${i + 1}: ${line.trim().slice(0, 80)}` : null))
    .filter((x): x is string => x !== null));
  expect(hits).toEqual([]);
});
