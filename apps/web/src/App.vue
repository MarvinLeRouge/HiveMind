<template>
  <div class="min-h-screen bg-background">
    <TheNavbar v-if="auth.isAuthenticated" />
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import TheNavbar from '@/components/TheNavbar.vue';

const auth = useAuthStore();
</script>
