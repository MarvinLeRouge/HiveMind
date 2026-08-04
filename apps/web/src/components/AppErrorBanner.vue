<template>
  <div
    role="alert"
    class="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="mt-0.5 h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <div class="flex-1">
      <p>{{ message }}</p>
      <button
        v-if="retry"
        class="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-current"
        @click="retry"
      >
        {{ t('common.retry') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  /** Error message to display. */
  message: string;
  /** Optional callback to retry the failed operation. */
  retry?: () => void;
}>();
</script>
