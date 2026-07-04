<template>
  <div class="min-h-screen bg-background">
    <TheNavbar v-if="auth.isAuthenticated" />
    <main>
      <RouterView />
    </main>
    <AppToast />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import TheNavbar from '@/components/TheNavbar.vue';
import AppToast from '@/components/AppToast.vue';

const auth = useAuthStore();
</script>
