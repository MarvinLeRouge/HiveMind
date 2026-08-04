<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-sm space-y-8">
      <div class="text-center">
        <h1 class="text-2xl font-bold tracking-tight">HiveMind</h1>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ t('auth.registerSubtitle') }}
        </p>
      </div>

      <!-- Email sent confirmation -->
      <div
        v-if="emailSent"
        class="rounded-md border border-green-200 bg-green-50 px-4 py-5 text-center dark:border-green-800 dark:bg-green-950"
      >
        <p class="text-sm font-medium text-green-800 dark:text-green-200">
          {{ t('auth.verificationEmailSent') }}
        </p>
        <p class="mt-1 text-sm text-green-700 dark:text-green-300">
          {{ t('auth.verificationEmailHint') }}
        </p>
        <RouterLink
          to="/login"
          class="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          {{ t('auth.signIn') }}
        </RouterLink>
      </div>

      <template v-else>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div
            v-if="error"
            role="alert"
            class="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {{ error }}
          </div>

          <div class="space-y-2">
            <label for="username" class="text-sm font-medium leading-none">
              {{ t('auth.username') }}
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              autocomplete="username"
              :placeholder="t('auth.usernamePlaceholder')"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div class="space-y-2">
            <label for="email" class="text-sm font-medium leading-none">
              {{ t('auth.email') }}
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              :placeholder="t('auth.emailPlaceholder')"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div class="space-y-2">
            <label for="password" class="text-sm font-medium leading-none">
              {{ t('auth.password') }}
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              autocomplete="new-password"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ loading ? t('auth.creatingAccount') : t('auth.createAccount') }}
          </button>
        </form>

        <p class="text-center text-sm text-muted-foreground">
          {{ t('auth.haveAccount') }}
          <RouterLink
            to="/login"
            class="font-medium text-primary hover:underline"
          >
            {{ t('auth.signIn') }}
          </RouterLink>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const auth = useAuthStore();

const form = ref({ username: '', email: '', password: '' });
const loading = ref(false);
const error = ref('');
const emailSent = ref(false);

/** Submits registration data. On success, shows the email confirmation state. */
async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.register(
      form.value.username,
      form.value.email,
      form.value.password,
    );
    emailSent.value = true;
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('auth.registerFailed');
  } finally {
    loading.value = false;
  }
}
</script>
