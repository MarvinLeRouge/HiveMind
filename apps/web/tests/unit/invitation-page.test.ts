import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import InvitationPage from '../../src/pages/InvitationPage.vue';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

import { apiFetch } from '../../src/lib/api-fetch';
const mockFetch = vi.mocked(apiFetch);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const INVITATION_ID = 'inv-uuid-1';

const pendingInvitation = {
  id: INVITATION_ID,
  collectionId: 'col-1',
  invitedBy: 'user-1',
  inviteeEmail: 'bob@example.com',
  status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-07-07T00:00:00.000Z',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/invitations/:id', component: InvitationPage },
      { path: '/collections', component: { template: '<div/>' } },
    ],
  });
}

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InvitationPage', () => {
  it('shows invitation details and action buttons for a pending invitation', async () => {
    mockFetch.mockResolvedValueOnce(pendingInvitation);
    const router = makeRouter();
    await router.push(`/invitations/${INVITATION_ID}`);

    const wrapper = mount(InvitationPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("You've been invited");
    expect(wrapper.text()).toContain('bob@example.com');
    expect(wrapper.find('button[disabled]').exists()).toBe(false);
  });

  it('shows an error block when the API call fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Not found'));
    const router = makeRouter();
    await router.push(`/invitations/${INVITATION_ID}`);

    const wrapper = mount(InvitationPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Invitation not found');
    expect(wrapper.text()).toContain('Not found');
  });

  it('shows an already-handled message when the invitation status is accepted', async () => {
    mockFetch.mockResolvedValueOnce({
      ...pendingInvitation,
      status: 'accepted',
    });
    const router = makeRouter();
    await router.push(`/invitations/${INVITATION_ID}`);

    const wrapper = mount(InvitationPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Invitation already accepted');
  });

  it('shows an already-handled message when the invitation status is declined', async () => {
    mockFetch.mockResolvedValueOnce({
      ...pendingInvitation,
      status: 'declined',
    });
    const router = makeRouter();
    await router.push(`/invitations/${INVITATION_ID}`);

    const wrapper = mount(InvitationPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Invitation already declined');
  });

  it('calls the accept endpoint and redirects to /collections on Accept', async () => {
    mockFetch
      .mockResolvedValueOnce(pendingInvitation)
      .mockResolvedValueOnce(undefined);
    const router = makeRouter();
    const pushSpy = vi.spyOn(router, 'push');
    await router.push(`/invitations/${INVITATION_ID}`);

    const wrapper = mount(InvitationPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    const acceptBtn = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Accept');
    await acceptBtn!.trigger('click');
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/invitations/${INVITATION_ID}/accept`),
      { method: 'POST' },
    );
    expect(pushSpy).toHaveBeenCalledWith('/collections');
  });

  it('calls the decline endpoint and redirects to /collections on Decline', async () => {
    mockFetch
      .mockResolvedValueOnce(pendingInvitation)
      .mockResolvedValueOnce(undefined);
    const router = makeRouter();
    const pushSpy = vi.spyOn(router, 'push');
    await router.push(`/invitations/${INVITATION_ID}`);

    const wrapper = mount(InvitationPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    const declineBtn = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Decline');
    await declineBtn!.trigger('click');
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/invitations/${INVITATION_ID}/decline`),
      { method: 'POST' },
    );
    expect(pushSpy).toHaveBeenCalledWith('/collections');
  });

  it('shows an inline error and re-enables buttons when accept fails', async () => {
    mockFetch
      .mockResolvedValueOnce(pendingInvitation)
      .mockRejectedValueOnce(new Error('Already accepted'));
    const router = makeRouter();
    await router.push(`/invitations/${INVITATION_ID}`);

    const wrapper = mount(InvitationPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    const acceptBtn = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Accept');
    await acceptBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Already accepted');
    expect(wrapper.find('button[disabled]').exists()).toBe(false);
  });

  it('shows an inline error and re-enables buttons when decline fails', async () => {
    mockFetch
      .mockResolvedValueOnce(pendingInvitation)
      .mockRejectedValueOnce(new Error('Already declined'));
    const router = makeRouter();
    await router.push(`/invitations/${INVITATION_ID}`);

    const wrapper = mount(InvitationPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    const declineBtn = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Decline');
    await declineBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Already declined');
    expect(wrapper.find('button[disabled]').exists()).toBe(false);
  });
});
