<template>
  <div class="container py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">{{ t('collection.title') }}</h1>
      <RouterLink
        to="/collections/new"
        class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        {{ t('collection.new') }}
      </RouterLink>
    </div>

    <p v-if="error" role="alert" class="text-sm text-destructive">
      {{ error }}
    </p>

    <AppSpinner v-else-if="loading" />

    <div
      v-else-if="collections.length === 0"
      class="flex flex-col items-center py-16 text-center"
    >
      <div class="mb-4 rounded-full bg-muted p-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-6 w-6 text-muted-foreground"
          aria-hidden="true"
        >
          <path
            d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
          />
        </svg>
      </div>
      <h2 class="mb-1 text-sm font-semibold text-foreground">
        {{ t('collection.noItems') }}
      </h2>
      <p class="mb-4 max-w-xs text-sm text-muted-foreground">
        {{ t('collection.noItemsHint') }}
      </p>
      <RouterLink
        to="/collections/new"
        class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        {{ t('collection.new') }}
      </RouterLink>
    </div>

    <ul v-else class="zebra divide-y overflow-hidden rounded-md border">
      <li v-for="col in collections" :key="col.id" class="transition-colors">
        <RouterLink
          :to="`/collections/${col.slug}`"
          class="flex items-center gap-4 px-5 py-4"
        >
          <!-- Colored initials avatar -->
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            :style="{ backgroundColor: slugToColor(col.slug) }"
            aria-hidden="true"
          >
            {{ initials(col.name) }}
          </div>

          <!-- Name + description -->
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-foreground">{{ col.name }}</p>
            <p
              v-if="col.description"
              class="mt-0.5 truncate text-sm text-muted-foreground"
            >
              {{ col.description }}
            </p>
          </div>

          <!-- Template + date (hidden on mobile) -->
          <div
            class="hidden shrink-0 flex-col items-end gap-1 text-right sm:flex"
          >
            <span class="text-xs text-muted-foreground">
              {{ col.templateSnapshot.name }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{ relativeDate(col.createdAt) }}
            </span>
          </div>

          <!-- Chevron -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCollectionStore } from '@/stores/collection';
import { storeToRefs } from 'pinia';
import AppSpinner from '@/components/AppSpinner.vue';

const { t, locale } = useI18n();
const store = useCollectionStore();
const { collections } = storeToRefs(store);
const loading = ref(true);
const error = ref('');

/** Hue values distributed across the spectrum, excluding the brand teal (~200). */
const COLLECTION_HUES = [20, 55, 100, 150, 250, 285, 320, 350] as const;

/**
 * Derives a stable OKLCH background color from a collection slug.
 * Dark enough (L 0.44) for white text at all hues.
 */
function slugToColor(slug: string): string {
  let hash = 0;
  for (const ch of slug ?? '') hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  const hue = COLLECTION_HUES[hash % COLLECTION_HUES.length];
  return `oklch(0.44 0.13 ${hue})`;
}

/** Returns up to two uppercase initials from a collection name. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Formats a date string as a locale-aware relative time string. */
function relativeDate(dateStr: string): string {
  const fmt = new Intl.RelativeTimeFormat(locale.value || 'en', {
    numeric: 'auto',
  });
  const diffMs = new Date(dateStr).getTime() - Date.now();
  const diffDays = Math.round(diffMs / 86_400_000);
  if (Math.abs(diffDays) < 1) {
    return fmt.format(Math.round(diffMs / 3_600_000), 'hour');
  }
  if (Math.abs(diffDays) < 30) {
    return fmt.format(diffDays, 'day');
  }
  return fmt.format(Math.round(diffDays / 30), 'month');
}

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
