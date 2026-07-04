import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useToastStore } from '../../src/stores/toast';

beforeEach(() => {
  setActivePinia(createPinia());
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useToastStore', () => {
  it('adds a toast with type success by default', () => {
    const store = useToastStore();
    store.add('Hello');
    expect(store.toasts).toHaveLength(1);
    expect(store.toasts[0].message).toBe('Hello');
    expect(store.toasts[0].type).toBe('success');
  });

  it('adds a toast with the given type', () => {
    const store = useToastStore();
    store.add('Oops', 'error');
    expect(store.toasts[0].type).toBe('error');
  });

  it('assigns a unique id to each toast', () => {
    const store = useToastStore();
    store.add('First');
    store.add('Second');
    const ids = store.toasts.map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('dismisses a toast by id', () => {
    const store = useToastStore();
    store.add('One');
    const { id } = store.toasts[0];
    store.dismiss(id);
    expect(store.toasts).toHaveLength(0);
  });

  it('auto-dismisses a success toast after 3500 ms', () => {
    const store = useToastStore();
    store.add('Done');
    expect(store.toasts).toHaveLength(1);
    vi.advanceTimersByTime(3500);
    expect(store.toasts).toHaveLength(0);
  });

  it('auto-dismisses an error toast after 6000 ms', () => {
    const store = useToastStore();
    store.add('Error', 'error');
    vi.advanceTimersByTime(3500);
    expect(store.toasts).toHaveLength(1);
    vi.advanceTimersByTime(2500);
    expect(store.toasts).toHaveLength(0);
  });

  it('stacks multiple toasts independently', () => {
    const store = useToastStore();
    store.add('First');
    store.add('Second');
    store.add('Third');
    expect(store.toasts).toHaveLength(3);
    vi.advanceTimersByTime(3500);
    expect(store.toasts).toHaveLength(0);
  });
});
