<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="variantClass"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/** Status badge for a puzzle. Renders a color-coded label. */
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

const label = computed(() => {
  const key = STATUS_I18N_KEYS[props.status];
  return key ? t(key) : props.status;
});

const variantClass = computed(() => {
  switch (props.status) {
    case 'open':
      return 'bg-slate-100 text-slate-700';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700';
    case 'solved':
      return 'bg-yellow-100 text-yellow-700';
    case 'verified':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-muted text-muted-foreground';
  }
});
</script>
