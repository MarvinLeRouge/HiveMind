import { describe, it, expect, beforeEach, vi } from 'vitest';

async function loadComposable() {
  vi.resetModules();
  const mod = await import('../../src/composables/useDarkMode');
  return mod.useDarkMode();
}

function mockPrefersDark(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({ matches }) as never;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  mockPrefersDark(false);
});

describe('useDarkMode', () => {
  it('starts in dark mode when the stored preference is dark', async () => {
    localStorage.setItem('hivemind-theme', 'dark');

    const { isDark } = await loadComposable();

    expect(isDark.value).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('follows the OS preference when nothing is stored', async () => {
    mockPrefersDark(true);

    const { isDark } = await loadComposable();

    expect(isDark.value).toBe(true);
  });

  it('ignores the OS preference when light mode is stored', async () => {
    localStorage.setItem('hivemind-theme', 'light');
    mockPrefersDark(true);

    const { isDark } = await loadComposable();

    expect(isDark.value).toBe(false);
  });

  it('toggles the dark class and persists the new choice', async () => {
    const { isDark, toggle } = await loadComposable();

    toggle();

    expect(isDark.value).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('hivemind-theme')).toBe('dark');

    toggle();

    expect(isDark.value).toBe(false);
    expect(localStorage.getItem('hivemind-theme')).toBe('light');
  });
});
