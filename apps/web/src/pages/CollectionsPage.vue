<template>
  <div class="container py-8">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Collections</h1>
      <RouterLink
        to="/collections/new"
        class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        New collection
      </RouterLink>
    </div>

    <p v-if="error" role="alert" class="text-sm text-destructive">
      {{ error }}
    </p>

    <p v-else-if="loading" class="text-sm text-muted-foreground">Loading…</p>

    <p
      v-else-if="collections.length === 0"
      class="text-sm text-muted-foreground"
    >
      You have no collections yet.
      <RouterLink to="/collections/new" class="text-primary hover:underline">
        Create your first one.
      </RouterLink>
    </p>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="col in collections"
        :key="col.id"
        :to="`/collections/${col.id}`"
        class="rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <h2 class="font-semibold text-card-foreground">{{ col.name }}</h2>
        <p
          v-if="col.description"
          class="mt-1 text-sm text-muted-foreground line-clamp-2"
        >
          {{ col.description }}
        </p>
        <p class="mt-3 text-xs text-muted-foreground">
          {{ col.templateSnapshot.name }}
        </p>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCollectionStore } from '@/stores/collection';
import { storeToRefs } from 'pinia';

const store = useCollectionStore();
const { collections } = storeToRefs(store);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    await store.fetchAll();
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : 'Failed to load collections.';
  } finally {
    loading.value = false;
  }
});
</script>
