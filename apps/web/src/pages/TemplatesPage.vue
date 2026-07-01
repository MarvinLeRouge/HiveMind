<template>
  <div class="container py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">{{ t('template.title') }}</h1>
      <RouterLink
        to="/templates/new"
        class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        + {{ t('template.new') }}
      </RouterLink>
    </div>

    <p v-if="loadError" role="alert" class="text-sm text-destructive">
      {{ loadError }}
    </p>

    <div
      v-else-if="templates.length === 0 && !loading"
      class="text-sm text-muted-foreground"
    >
      {{ t('template.noItems') }}
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="tmpl in templates"
        :key="tmpl.id"
        class="flex items-center gap-3 rounded-md border px-4 py-3 text-sm"
      >
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ tmpl.name }}</span>
            <span
              v-if="tmpl.isSystem"
              class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
            >
              {{ t('template.system') }}
            </span>
            <span
              v-if="tmpl.isPublic"
              class="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-700"
            >
              {{ t('template.public') }}
            </span>
          </div>
          <p
            v-if="tmpl.description"
            class="mt-0.5 text-xs text-muted-foreground"
          >
            {{ tmpl.description }}
          </p>
          <p class="mt-0.5 text-xs text-muted-foreground">
            {{ t('template.fields') }}:
            <span v-if="activeFields(tmpl).length">{{
              activeFields(tmpl).join(', ')
            }}</span>
            <span v-else>none</span>
          </p>
        </div>

        <div v-if="canEdit(tmpl)" class="flex shrink-0 gap-3">
          <RouterLink
            :to="`/templates/${tmpl.id}/edit`"
            class="text-xs text-muted-foreground hover:text-foreground"
          >
            {{ t('common.edit') }}
          </RouterLink>
          <button
            class="text-xs text-destructive hover:underline"
            @click="handleDelete(tmpl.id)"
          >
            {{ t('common.delete') }}
          </button>
        </div>
      </li>
    </ul>

    <p v-if="loading" class="text-sm text-muted-foreground">
      {{ t('common.loading') }}
    </p>

    <p v-if="deleteError" role="alert" class="mt-4 text-sm text-destructive">
      {{ deleteError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useTemplateStore } from '@/stores/template';
import { useAuthStore } from '@/stores/auth';
import type { Template } from '@/types/template';

const { t } = useI18n();
const store = useTemplateStore();
const auth = useAuthStore();
const { templates } = storeToRefs(store);

const loading = ref(true);
const loadError = ref('');
const deleteError = ref('');

onMounted(async () => {
  try {
    await store.fetchAll();
  } catch (e) {
    loadError.value =
      e instanceof Error ? e.message : 'Failed to load templates.';
  } finally {
    loading.value = false;
  }
});

/** Returns true when the current user may edit or delete the template. */
function canEdit(tmpl: Template): boolean {
  if (auth.user?.isAdmin) return true;
  return tmpl.createdBy === auth.user?.id;
}

/** Returns the list of enabled field labels for display. */
function activeFields(tmpl: Template): string[] {
  const map: [keyof Template, string][] = [
    ['indexMode', 'Index'],
    ['gcCodeMode', t('template.gcCode')],
    ['difficultyMode', t('template.difficultyRating')],
    ['terrainMode', t('template.terrainRating')],
    ['coordsMode', t('template.coordinates')],
    ['hintMode', t('template.hint')],
    ['spoilerMode', t('template.spoiler')],
  ];
  const fields = map
    .filter(([key]) => tmpl[key] !== 'disabled')
    .map(([, label]) => label);
  if (tmpl.customField1Label && tmpl.customField1Mode !== 'disabled')
    fields.push(tmpl.customField1Label);
  if (tmpl.customField2Label && tmpl.customField2Mode !== 'disabled')
    fields.push(tmpl.customField2Label);
  return fields;
}

/** Deletes a template after confirmation. */
async function handleDelete(id: string) {
  deleteError.value = '';
  try {
    await store.delete(id);
  } catch (e) {
    deleteError.value =
      e instanceof Error ? e.message : 'Failed to delete template.';
  }
}
</script>
