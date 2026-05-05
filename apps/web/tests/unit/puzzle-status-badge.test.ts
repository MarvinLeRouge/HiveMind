import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PuzzleStatusBadge from '../../src/components/PuzzleStatusBadge.vue';

describe('PuzzleStatusBadge', () => {
  it.each([
    ['open', 'Open'],
    ['in_progress', 'In progress'],
    ['solved', 'Solved'],
    ['verified', 'Verified'],
  ])('renders the label for status "%s"', (status, label) => {
    const wrapper = mount(PuzzleStatusBadge, { props: { status } });
    expect(wrapper.text()).toBe(label);
  });

  it('renders an unknown status as-is', () => {
    const wrapper = mount(PuzzleStatusBadge, { props: { status: 'custom' } });
    expect(wrapper.text()).toBe('custom');
  });

  it('applies green classes for verified status', () => {
    const wrapper = mount(PuzzleStatusBadge, { props: { status: 'verified' } });
    expect(wrapper.classes().some((c) => c.includes('green'))).toBe(true);
  });

  it('applies blue classes for in_progress status', () => {
    const wrapper = mount(PuzzleStatusBadge, {
      props: { status: 'in_progress' },
    });
    expect(wrapper.classes().some((c) => c.includes('blue'))).toBe(true);
  });
});
