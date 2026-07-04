import { ref, computed } from 'vue';

const STORAGE_KEY = 'hivemind-theme';

/** Module-level singleton so all consumers share the same state. */
const isDarkRef = ref(false);

function apply(dark: boolean): void {
  isDarkRef.value = dark;
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
}

/** Initialise from localStorage, falling back to OS preference. */
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  apply(stored === 'dark' || (stored === null && prefersDark));
}

/**
 * Composable for toggling dark / light mode.
 * Persists choice to localStorage under `hivemind-theme`.
 * Respects `prefers-color-scheme` when no preference is stored.
 */
export function useDarkMode() {
  /** Toggle between dark and light mode. */
  function toggle(): void {
    apply(!isDarkRef.value);
  }

  return { isDark: computed(() => isDarkRef.value), toggle };
}
