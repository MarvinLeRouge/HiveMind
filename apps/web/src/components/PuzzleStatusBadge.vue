<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :style="{
      backgroundColor: `var(--status-${cssKey}-bg)`,
      color: `var(--status-${cssKey}-text)`,
    }"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/** Status badge for a puzzle. Uses semantic CSS tokens from main.css. */
const props = defineProps<{
  status: string;
}>();

const { t } = useI18n();

const STATUS_I18N_KEYS: Record<string, string> = {
  open: 'puzzle.status.open',
  in_progress: 'puzzle.status.in_progress',
  solved: 'puzzle.status.solved',
  verified: 'puzzle.status.verified',
};

const STATUS_CSS_KEYS: Record<string, string> = {
  open: 'open',
  in_progress: 'in-progress',
  solved: 'solved',
  verified: 'verified',
};

const label = computed(() => {
  const key = STATUS_I18N_KEYS[props.status];
  return key ? t(key) : props.status;
});

const cssKey = computed(
  () => STATUS_CSS_KEYS[props.status] ?? props.status.replace(/_/g, '-'),
);
</script>
