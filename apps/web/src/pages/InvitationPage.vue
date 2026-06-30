<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/30 px-4">
    <div class="w-full max-w-md rounded-lg border bg-background p-8 shadow-sm">
      <!-- Loading -->
      <p v-if="loading" class="text-sm text-muted-foreground">Loading…</p>

      <!-- Error loading invitation -->
      <div v-else-if="loadError">
        <h1 class="text-xl font-bold">Invitation not found</h1>
        <p class="mt-2 text-sm text-muted-foreground">{{ loadError }}</p>
        <RouterLink
          to="/collections"
          class="mt-4 inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
        >
          Go to my collections
        </RouterLink>
      </div>

      <!-- Already handled -->
      <div v-else-if="invitation && invitation.status !== 'pending'">
        <h1 class="text-xl font-bold">
          Invitation already {{ invitation.status }}
        </h1>
        <p class="mt-2 text-sm text-muted-foreground">
          This invitation has already been {{ invitation.status }}.
        </p>
        <RouterLink
          to="/collections"
          class="mt-4 inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
        >
          Go to my collections
        </RouterLink>
      </div>

      <!-- Active invitation -->
      <div v-else-if="invitation">
        <h1 class="text-xl font-bold">You've been invited</h1>
        <p class="mt-3 text-sm text-muted-foreground">
          An invitation was sent to
          <strong class="text-foreground">{{ invitation.inviteeEmail }}</strong
          >.
        </p>
        <p class="mt-1 text-sm text-muted-foreground">
          Expires on {{ expiryLabel }}.
        </p>

        <p
          v-if="actionError"
          role="alert"
          class="mt-4 text-sm text-destructive"
        >
          {{ actionError }}
        </p>

        <div class="mt-6 flex gap-3">
          <button
            :disabled="!!acting"
            class="inline-flex h-9 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
            @click="accept"
          >
            {{ acting === 'accept' ? 'Accepting…' : 'Accept' }}
          </button>
          <button
            :disabled="!!acting"
            class="inline-flex h-9 items-center rounded-md border px-5 text-sm font-medium hover:bg-muted disabled:opacity-50"
            @click="decline"
          >
            {{ acting === 'decline' ? 'Declining…' : 'Decline' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiFetch } from '@/lib/api-fetch';

interface Invitation {
  id: string;
  collectionId: string;
  invitedBy: string;
  inviteeEmail: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

const route = useRoute();
const router = useRouter();

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const invitationId = route.params.id as string;

const loading = ref(true);
const loadError = ref('');
const invitation = ref<Invitation | null>(null);
const acting = ref<'accept' | 'decline' | null>(null);
const actionError = ref('');

const expiryLabel = computed(() => {
  if (!invitation.value) return '';
  return new Date(invitation.value.expiresAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

onMounted(async () => {
  try {
    invitation.value = await apiFetch<Invitation>(
      `${BASE_URL}/invitations/${invitationId}`,
    );
  } catch (e) {
    loadError.value =
      e instanceof Error
        ? e.message
        : 'This invitation does not exist or has expired.';
  } finally {
    loading.value = false;
  }
});

/** Accepts the invitation and redirects to the collections list. */
async function accept() {
  actionError.value = '';
  acting.value = 'accept';
  try {
    await apiFetch(`${BASE_URL}/invitations/${invitationId}/accept`, {
      method: 'POST',
    });
    router.push('/collections');
  } catch (e) {
    actionError.value =
      e instanceof Error ? e.message : 'Failed to accept invitation.';
    acting.value = null;
  }
}

/** Declines the invitation and redirects to the collections list. */
async function decline() {
  actionError.value = '';
  acting.value = 'decline';
  try {
    await apiFetch(`${BASE_URL}/invitations/${invitationId}/decline`, {
      method: 'POST',
    });
    router.push('/collections');
  } catch (e) {
    actionError.value =
      e instanceof Error ? e.message : 'Failed to decline invitation.';
    acting.value = null;
  }
}
</script>
