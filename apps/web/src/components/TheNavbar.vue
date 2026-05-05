<template>
  <nav class="border-b bg-background">
    <div
      class="container flex min-h-14 flex-wrap items-center gap-x-6 gap-y-2 py-2"
    >
      <RouterLink to="/collections" class="font-semibold text-foreground">
        HiveMind
      </RouterLink>

      <RouterLink
        to="/templates"
        class="text-sm text-muted-foreground hover:text-foreground"
      >
        Templates
      </RouterLink>

      <div class="ml-auto flex items-center gap-4">
        <span class="text-sm text-muted-foreground">{{
          auth.user?.username
        }}</span>
        <button
          class="text-sm text-muted-foreground hover:text-foreground transition-colors"
          @click="handleLogout"
        >
          Log out
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

/** Logs out and redirects to the login page. */
async function handleLogout() {
  await auth.logout();
  router.push('/login');
}
</script>
