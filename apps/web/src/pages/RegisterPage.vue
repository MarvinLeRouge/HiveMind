<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-sm space-y-8">
      <div class="text-center">
        <h1 class="text-2xl font-bold tracking-tight">HiveMind</h1>
        <p class="mt-2 text-sm text-muted-foreground">Create your account</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div
          v-if="error"
          role="alert"
          class="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {{ error }}
        </div>

        <div class="space-y-2">
          <label for="username" class="text-sm font-medium leading-none"
            >Username</label
          >
          <input
            id="username"
            v-model="form.username"
            type="text"
            required
            autocomplete="username"
            placeholder="alice"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div class="space-y-2">
          <label for="email" class="text-sm font-medium leading-none"
            >Email</label
          >
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            autocomplete="email"
            placeholder="you@example.com"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div class="space-y-2">
          <label for="password" class="text-sm font-medium leading-none"
            >Password</label
          >
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            autocomplete="new-password"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ loading ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <p class="text-center text-sm text-muted-foreground">
        Already have an account?
        <RouterLink
          to="/login"
          class="font-medium text-primary hover:underline"
        >
          Sign in
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const form = ref({ username: '', email: '', password: '' });
const loading = ref(false);
const error = ref('');

/** Submits registration data and redirects to collections on success. */
async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.register(
      form.value.username,
      form.value.email,
      form.value.password,
    );
    await router.push('/collections');
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : 'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>
