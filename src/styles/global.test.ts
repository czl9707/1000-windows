import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');

describe('the theme token sheet', () => {
  it('registers every channel with the light theme as its initial value', () => {
    // The registration's initial-value repeats the light declaration
    // (platform-mandated), so the pairing is held by this guard: the first
    // --theme-* match in the sheet is the light body block, the dark block
    // follows it.
    const channels: [string, string][] = [
      ['--ch-primary-background', '--theme-paper'],
      ['--ch-primary-foreground', '--theme-ink'],
      ['--ch-secondary-background', '--theme-dim-paper'],
      ['--ch-secondary-foreground', '--theme-dim'],
    ];
    for (const [channel, themeVar] of channels) {
      for (const axis of ['-r', '-g', '-b']) {
        const initial = css.match(new RegExp(`${channel}${axis}[^}]*initial-value:\\s*(\\d+)`));
        const declared = css.match(new RegExp(`${themeVar}${axis}:\\s*(\\d+)`));
        expect(initial, `${channel}${axis} registration`).not.toBeNull();
        expect(declared, `${themeVar}${axis} light declaration`).not.toBeNull();
        expect(Number(initial![1])).toBe(Number(declared![1]));
      }
    }
  });

  it('transitions every channel on the curve the fade solves — cubic-bezier(0.25, 0.1, 0.25, 1)', () => {
    const entries = [
      ...css.matchAll(/--ch-[a-z-]+ var\(--transition-theme\)\s+cubic-bezier\(([^)]+)\)/g),
    ].map((m) => m[1].split(',').map(Number));
    expect(entries.length).toBe(12);
    for (const curve of entries) {
      expect(curve).toEqual([0.25, 0.1, 0.25, 1]);
    }
    // No channel rides the bare keyword alias — the guard reads the control
    // points, so the sheet must spell them.
    expect(css.match(/--ch-[a-z-]+ var\(--transition-theme\)\s+ease\b/)).toBeNull();
  });
});
