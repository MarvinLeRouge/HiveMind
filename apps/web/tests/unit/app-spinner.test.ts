import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppSpinner from '../../src/components/AppSpinner.vue';

describe('AppSpinner', () => {
  it('renders an animated SVG', () => {
    const wrapper = mount(AppSpinner);
    expect(wrapper.find('svg').exists()).toBe(true);
    expect(wrapper.find('.animate-spin').exists()).toBe(true);
  });

  it('has a screen-reader label', () => {
    const wrapper = mount(AppSpinner);
    expect(wrapper.find('.sr-only').exists()).toBe(true);
  });
});
