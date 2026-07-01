<template>
  <div>
    <!-- Member list -->
    <ul class="space-y-2">
      <li
        v-for="m in members"
        :key="m.userId"
        class="rounded-md border px-3 py-3 text-sm"
      >
        <div class="truncate font-medium">{{ m.username }}</div>
        <div class="mt-0.5 truncate text-xs text-muted-foreground">
          {{ m.email }}
        </div>
        <div class="mt-2 flex items-center gap-2">
          <span class="rounded bg-muted px-1.5 py-0.5 text-xs">{{
            m.role
          }}</span>
          <button
            v-if="isOwner && m.userId !== authUserId"
            class="text-xs text-destructive hover:underline"
            @click="emit('remove', m.userId)"
          >
            {{ t('common.remove') }}
          </button>
        </div>
      </li>
    </ul>

    <!-- Invite form (owner only) -->
    <template v-if="isOwner">
      <hr class="mt-6 mb-4" />
      <h3 class="mb-3 text-sm font-semibold">{{ t('collection.invite') }}</h3>
      <form class="flex flex-col gap-2" @submit.prevent="submitInvite">
        <label for="panel-invite-email" class="sr-only">Email address</label>
        <input
          id="panel-invite-email"
          v-model="emailInput"
          type="email"
          required
          placeholder="colleague@example.com"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          :disabled="inviting"
          class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
        >
          {{
            inviting ? t('collection.sending') : t('collection.sendInvitation')
          }}
        </button>
      </form>
      <p v-if="inviteSuccess" class="mt-2 text-sm text-green-600">
        {{ t('collection.invitationSent') }}
      </p>
      <p v-if="inviteError" role="alert" class="mt-2 text-sm text-destructive">
        {{ inviteError }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface Member {
  userId: string;
  username: string;
  email: string;
  role: string;
  joinedAt: string;
}

const { t } = useI18n();

defineProps<{
  members: Member[];
  isOwner: boolean;
  authUserId: string | undefined;
  inviting: boolean;
  inviteSuccess: boolean;
  inviteError: string;
}>();

const emit = defineEmits<{
  remove: [userId: string];
  invite: [email: string];
}>();

const emailInput = ref('');

/** Emits the invite event with the current email and resets the input. */
function submitInvite() {
  emit('invite', emailInput.value);
  emailInput.value = '';
}
</script>
