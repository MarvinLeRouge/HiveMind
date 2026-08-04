import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AppToast from '../../src/components/AppToast.vue';
import { useToastStore } from '../../src/stores/toast';
import i18n from '../../src/i18n';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

const STUBS = {
  Teleport: { template: '<div><slot /></div>' },
  TransitionGroup: { template: '<div><slot /></div>' },
};

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
});

describe('AppToast', () => {
  it('renders no toast items when the store is empty', () => {
    const wrapper = mount(AppToast, {
      global: { plugins: [pinia, i18n], stubs: STUBS },
    });
    expect(wrapper.findAll('[role="status"]')).toHaveLength(0);
  });

  it('renders the aria-live region', () => {
    const wrapper = mount(AppToast, {
      global: { plugins: [pinia, i18n], stubs: STUBS },
    });
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true);
  });

  it('renders a toast item when the store has a toast', () => {
    const store = useToastStore();
    store.toasts = [{ id: '1', type: 'success', message: 'Saved!' }];
    const wrapper = mount(AppToast, {
      global: { plugins: [pinia, i18n], stubs: STUBS },
    });
    const item = wrapper.find('[role="status"]');
    expect(item.exists()).toBe(true);
    expect(item.text()).toContain('Saved!');
  });

  it('applies success token styles for success type', () => {
    const store = useToastStore();
    store.toasts = [{ id: '1', type: 'success', message: 'Done' }];
    const wrapper = mount(AppToast, {
      global: { plugins: [pinia, i18n], stubs: STUBS },
    });
    const item = wrapper.find('[role="status"]');
    expect(item.attributes('style')).toContain('--toast-ok-bg');
  });

  it('applies destructive classes for error type', () => {
    const store = useToastStore();
    store.toasts = [{ id: '2', type: 'error', message: 'Failed' }];
    const wrapper = mount(AppToast, {
      global: { plugins: [pinia, i18n], stubs: STUBS },
    });
    const item = wrapper.find('[role="status"]');
    expect(item.classes().some((c) => c.includes('destructive'))).toBe(true);
  });

  it('renders the correct SVG icon for success', () => {
    const store = useToastStore();
    store.toasts = [{ id: '1', type: 'success', message: 'OK' }];
    const wrapper = mount(AppToast, {
      global: { plugins: [pinia, i18n], stubs: STUBS },
    });
    expect(wrapper.find('polyline[points="20 6 9 17 4 12"]').exists()).toBe(
      true,
    );
  });

  it('renders the correct SVG icon for error', () => {
    const store = useToastStore();
    store.toasts = [{ id: '2', type: 'error', message: 'Oops' }];
    const wrapper = mount(AppToast, {
      global: { plugins: [pinia, i18n], stubs: STUBS },
    });
    expect(wrapper.find('circle[cx="12"][cy="12"][r="10"]').exists()).toBe(
      true,
    );
  });

  it('renders multiple toasts', () => {
    const store = useToastStore();
    store.toasts = [
      { id: '1', type: 'success', message: 'First' },
      { id: '2', type: 'error', message: 'Second' },
    ];
    const wrapper = mount(AppToast, {
      global: { plugins: [pinia, i18n], stubs: STUBS },
    });
    expect(wrapper.findAll('[role="status"]')).toHaveLength(2);
  });

  it('calls store.dismiss when the close button is clicked', async () => {
    const store = useToastStore();
    store.toasts = [{ id: '42', type: 'success', message: 'Bye' }];
    const wrapper = mount(AppToast, {
      global: { plugins: [pinia, i18n], stubs: STUBS },
    });
    await wrapper.find('button').trigger('click');
    expect(store.toasts).toHaveLength(0);
  });
});
