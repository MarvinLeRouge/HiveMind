<template>
  <div class="min-h-screen bg-background">
    <TheNavbar v-if="auth.isAuthenticated" />
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import TheNavbar from '@/components/TheNavbar.vue';

const auth = useAuthStore();

onMounted(() => {
  auth.init();
});
</script>
