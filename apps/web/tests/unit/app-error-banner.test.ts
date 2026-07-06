import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AppErrorBanner from '../../src/components/AppErrorBanner.vue';
import i18n from '../../src/i18n';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
});

describe('AppErrorBanner', () => {
  it('renders the error message', () => {
    const wrapper = mount(AppErrorBanner, {
      props: { message: 'Something went wrong' },
      global: { plugins: [pinia, i18n] },
    });
    expect(wrapper.text()).toContain('Something went wrong');
  });

  it('has role="alert" for accessibility', () => {
    const wrapper = mount(AppErrorBanner, {
      props: { message: 'Error' },
      global: { plugins: [pinia, i18n] },
    });
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });

  it('shows the retry button when retry prop is provided', () => {
    const wrapper = mount(AppErrorBanner, {
      props: { message: 'Error', retry: vi.fn() },
      global: { plugins: [pinia, i18n] },
    });
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.find('button').text()).toBe('Try again');
  });

  it('does not show a retry button when retry prop is absent', () => {
    const wrapper = mount(AppErrorBanner, {
      props: { message: 'Error' },
      global: { plugins: [pinia, i18n] },
    });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('calls the retry callback when the retry button is clicked', async () => {
    const retry = vi.fn();
    const wrapper = mount(AppErrorBanner, {
      props: { message: 'Error', retry },
      global: { plugins: [pinia, i18n] },
    });
    await wrapper.find('button').trigger('click');
    expect(retry).toHaveBeenCalledOnce();
  });

  it('renders the error SVG icon', () => {
    const wrapper = mount(AppErrorBanner, {
      props: { message: 'Error' },
      global: { plugins: [pinia, i18n] },
    });
    expect(wrapper.find('circle[cx="12"][cy="12"][r="10"]').exists()).toBe(
      true,
    );
  });
});
