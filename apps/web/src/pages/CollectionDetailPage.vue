<template>
  <div class="container py-8">
    <p v-if="loadError" role="alert" class="text-sm text-destructive">
      {{ loadError }}
    </p>

    <template v-else-if="current">
      <!-- Header -->
      <div class="mb-6 flex items-start justify-between">
        <div>
          <RouterLink
            to="/collections"
            class="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Collections
          </RouterLink>
          <h1 class="mt-1 text-2xl font-bold">{{ current.name }}</h1>
          <p
            v-if="current.description"
            class="mt-1 text-sm text-muted-foreground"
          >
            {{ current.description }}
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            Template: {{ current.templateSnapshot.name }}
          </p>
        </div>
        <div class="flex items-center gap-4">
          <RouterLink
            :to="`/collections/${current.slug}/puzzles`"
            class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            View puzzles
          </RouterLink>
          <RouterLink
            v-if="isOwner"
            :to="`/collections/${current.slug}/settings`"
            class="text-sm text-muted-foreground hover:text-foreground"
          >
            Settings
          </RouterLink>
        </div>
      </div>

      <!-- Members -->
      <section class="mb-8">
        <h2 class="mb-3 text-lg font-semibold">Members</h2>
        <ul class="space-y-2">
          <li
            v-for="m in members"
            :key="m.userId"
            class="flex items-center justify-between rounded-md border px-4 py-3 text-sm"
          >
            <span>
              <span class="font-medium">{{ m.username }}</span>
              <span class="ml-2 text-muted-foreground">{{ m.email }}</span>
              <span class="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">{{
                m.role
              }}</span>
            </span>
            <button
              v-if="isOwner && m.userId !== authUser?.id"
              class="text-xs text-destructive hover:underline"
              @click="handleRemoveMember(m.userId)"
            >
              Remove
            </button>
          </li>
        </ul>
      </section>

      <!-- Invite (owner only) -->
      <section v-if="isOwner">
        <h2 class="mb-3 text-lg font-semibold">Invite a member</h2>
        <form class="flex gap-3" @submit.prevent="handleInvite">
          <input
            v-model="inviteEmail"
            type="email"
            required
            placeholder="colleague@example.com"
            class="flex h-9 w-72 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            :disabled="inviting"
            class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {{ inviting ? 'Sending…' : 'Send invitation' }}
          </button>
        </form>
        <p v-if="inviteSuccess" class="mt-2 text-sm text-green-600">
          Invitation sent.
        </p>
        <p
          v-if="inviteError"
          role="alert"
          class="mt-2 text-sm text-destructive"
        >
          {{ inviteError }}
        </p>
      </section>
    </template>

    <p v-else class="text-sm text-muted-foreground">Loading…</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useCollectionStore } from '@/stores/collection';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const store = useCollectionStore();
const auth = useAuthStore();
const { current, members, isOwner } = storeToRefs(store);
const authUser = auth.user;

const loadError = ref('');
const inviteEmail = ref('');
const inviting = ref(false);
const inviteSuccess = ref(false);
const inviteError = ref('');

onMounted(async () => {
  try {
    await store.fetchById(route.params.id as string);
  } catch (e) {
    loadError.value =
      e instanceof Error ? e.message : 'Failed to load collection.';
  }
});

/** Removes a member from the collection. */
async function handleRemoveMember(userId: string) {
  try {
    await store.removeMember(route.params.id as string, userId);
  } catch (e) {
    loadError.value =
      e instanceof Error ? e.message : 'Failed to remove member.';
  }
}

/** Sends an invitation to the provided email address. */
async function handleInvite() {
  inviteSuccess.value = false;
  inviteError.value = '';
  inviting.value = true;
  try {
    await store.invite(route.params.id as string, inviteEmail.value);
    inviteSuccess.value = true;
    inviteEmail.value = '';
  } catch (e) {
    inviteError.value =
      e instanceof Error ? e.message : 'Failed to send invitation.';
  } finally {
    inviting.value = false;
  }
}
</script>
