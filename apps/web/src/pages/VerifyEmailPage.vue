<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-sm space-y-6 text-center">
      <h1 class="text-2xl font-bold tracking-tight">HiveMind</h1>

      <!-- Loading -->
      <div v-if="status === 'loading'" class="flex flex-col items-center gap-3">
        <AppSpinner />
        <p class="text-sm text-muted-foreground">
          {{ t('auth.verifying') }}
        </p>
      </div>

      <!-- Success -->
      <div
        v-else-if="status === 'success'"
        class="rounded-md border border-green-200 bg-green-50 px-4 py-5 dark:border-green-800 dark:bg-green-950"
      >
        <p class="text-sm font-medium text-green-800 dark:text-green-200">
          {{ t('auth.verifySuccess') }}
        </p>
        <RouterLink
          to="/login"
          class="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          {{ t('auth.signIn') }}
        </RouterLink>
      </div>

      <!-- Error -->
      <div
        v-else-if="status === 'error'"
        class="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-5"
      >
        <p class="text-sm text-destructive">
          {{ t('auth.verifyError') }}
        </p>
        <RouterLink
          to="/login"
          class="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          {{ t('auth.signIn') }}
        </RouterLink>
      </div>

      <!-- Missing token -->
      <div
        v-else-if="status === 'missing'"
        class="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-5"
      >
        <p class="text-sm text-destructive">
          {{ t('auth.verifyMissingToken') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import AppSpinner from '@/components/AppSpinner.vue';

const { t } = useI18n();
const route = useRoute();
const auth = useAuthStore();

type Status = 'loading' | 'success' | 'error' | 'missing';
const status = ref<Status>('loading');

onMounted(async () => {
  const token = route.query['token'];
  if (!token || typeof token !== 'string') {
    status.value = 'missing';
    return;
  }

  try {
    await auth.verifyEmail(token);
    status.value = 'success';
  } catch {
    status.value = 'error';
  }
});
</script>
