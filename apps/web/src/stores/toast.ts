import { ref } from 'vue';
import { defineStore } from 'pinia';

export type ToastType = 'success' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

/** Durations in ms before a toast auto-dismisses. */
const DURATION: Record<ToastType, number> = {
  success: 3500,
  error: 6000,
};

/**
 * Global toast notification store.
 * Add a toast with `add(message, type)`; it auto-dismisses after a type-specific delay.
 */
export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([]);

  /**
   * Adds a toast notification and schedules its removal.
   * @param message - Translated message string to display.
   * @param type - Visual severity; defaults to 'success'.
   */
  function add(message: string, type: ToastType = 'success'): void {
    const id = crypto.randomUUID();
    toasts.value.push({ id, type, message });
    setTimeout(() => dismiss(id), DURATION[type]);
  }

  /**
   * Removes a toast by id immediately (used for manual close and auto-dismiss).
   * @param id - Toast id returned by add().
   */
  function dismiss(id: string): void {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { toasts, add, dismiss };
});
