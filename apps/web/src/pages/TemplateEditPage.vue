<template>
  <div class="container max-w-2xl py-8">
    <RouterLink
      to="/templates"
      class="text-sm text-muted-foreground hover:text-foreground"
    >
      ← {{ t('template.title') }}
    </RouterLink>

    <p v-if="loadError" role="alert" class="mt-4 text-sm text-destructive">
      {{ loadError }}
    </p>

    <template v-else-if="form">
      <h1 class="mt-2 text-2xl font-bold">{{ t('template.editTitle') }}</h1>

      <form class="mt-6 space-y-6" @submit.prevent="handleSubmit">
        <!-- Name -->
        <div class="space-y-1">
          <label for="name" class="text-sm font-medium">
            {{ t('template.name') }}
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            maxlength="64"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <!-- Description -->
        <div class="space-y-1">
          <label for="description" class="text-sm font-medium">
            {{ t('template.description') }}
            <span class="text-muted-foreground">{{
              t('common.optional')
            }}</span>
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="2"
            maxlength="256"
            class="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <!-- Visibility -->
        <div class="flex items-center gap-2">
          <input
            id="isPublic"
            v-model="form.isPublic"
            type="checkbox"
            class="h-4 w-4 rounded border-input"
          />
          <label for="isPublic" class="text-sm font-medium">
            {{ t('template.publicLabel') }}
          </label>
        </div>

        <!-- Puzzle fields -->
        <fieldset class="space-y-3 rounded-md border p-4">
          <legend class="px-1 text-sm font-medium">
            {{ t('template.puzzleFields') }}
          </legend>

          <div
            v-for="field in modeFields"
            :key="field.key"
            class="flex items-center justify-between gap-4"
          >
            <label :for="field.key" class="text-sm">{{ field.label }}</label>
            <select
              :id="field.key"
              v-model="form[field.key]"
              class="h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="disabled">{{ t('template.disabled') }}</option>
              <option value="optional">{{ t('template.optional') }}</option>
              <option value="required">{{ t('template.required') }}</option>
            </select>
          </div>

          <!-- Custom fields -->
          <div
            v-for="cf in customFields"
            :key="cf.labelKey"
            class="flex flex-wrap items-center gap-2 border-t pt-3"
          >
            <label :for="cf.labelKey" class="w-24 text-sm">
              {{ cf.label }}
            </label>
            <input
              :id="cf.labelKey"
              v-model="form[cf.labelKey]"
              type="text"
              maxlength="32"
              :placeholder="`Label (e.g. ${cf.placeholder})`"
              class="flex h-8 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <select
              v-model="form[cf.modeKey]"
              class="h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="disabled">{{ t('template.disabled') }}</option>
              <option value="optional">{{ t('template.optional') }}</option>
              <option value="required">{{ t('template.required') }}</option>
            </select>
          </div>
        </fieldset>

        <p v-if="error" role="alert" class="text-sm text-destructive">
          {{ error }}
        </p>

        <div class="flex gap-3">
          <button
            type="submit"
            :disabled="saving"
            class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {{ saving ? t('common.saving') : t('template.saveChanges') }}
          </button>
          <RouterLink
            to="/templates"
            class="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
          >
            {{ t('common.cancel') }}
          </RouterLink>
        </div>
      </form>
    </template>

    <p v-else class="mt-4 text-sm text-muted-foreground">
      {{ t('common.loading') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useTemplateStore } from '@/stores/template';
import type { FieldMode } from '@/types/template';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useTemplateStore();

const templateId = route.params.id as string;
const saving = ref(false);
const loadError = ref('');
const error = ref('');

type FormShape = {
  name: string;
  description: string;
  isPublic: boolean;
  indexMode: FieldMode;
  gcCodeMode: FieldMode;
  difficultyMode: FieldMode;
  terrainMode: FieldMode;
  coordsMode: FieldMode;
  hintMode: FieldMode;
  spoilerMode: FieldMode;
  customField1Label: string;
  customField1Mode: FieldMode;
  customField2Label: string;
  customField2Mode: FieldMode;
};

const form = ref<FormShape | null>(null);

const modeFields = computed(() => [
  { key: 'indexMode' as const, label: t('template.indexNumber') },
  { key: 'gcCodeMode' as const, label: t('template.gcCode') },
  { key: 'difficultyMode' as const, label: t('template.difficultyRating') },
  { key: 'terrainMode' as const, label: t('template.terrainRating') },
  { key: 'coordsMode' as const, label: t('template.coordinates') },
  { key: 'hintMode' as const, label: t('template.hint') },
  { key: 'spoilerMode' as const, label: t('template.spoiler') },
]);

const customFields = computed(() => [
  {
    label: t('template.customField', { n: 1 }),
    labelKey: 'customField1Label' as const,
    modeKey: 'customField1Mode' as const,
    placeholder: 'Zone',
  },
  {
    label: t('template.customField', { n: 2 }),
    labelKey: 'customField2Label' as const,
    modeKey: 'customField2Mode' as const,
    placeholder: 'Reference',
  },
]);

onMounted(async () => {
  try {
    await store.fetchById(templateId);
    const tmpl = store.current!;
    form.value = {
      name: tmpl.name,
      description: tmpl.description ?? '',
      isPublic: tmpl.isPublic,
      indexMode: tmpl.indexMode,
      gcCodeMode: tmpl.gcCodeMode,
      difficultyMode: tmpl.difficultyMode,
      terrainMode: tmpl.terrainMode,
      coordsMode: tmpl.coordsMode,
      hintMode: tmpl.hintMode,
      spoilerMode: tmpl.spoilerMode,
      customField1Label: tmpl.customField1Label ?? '',
      customField1Mode: tmpl.customField1Mode,
      customField2Label: tmpl.customField2Label ?? '',
      customField2Mode: tmpl.customField2Mode,
    };
  } catch (e) {
    loadError.value =
      e instanceof Error ? e.message : 'Failed to load template.';
  }
});

/** Submits the update form. */
async function handleSubmit() {
  if (!form.value) return;
  error.value = '';
  saving.value = true;
  try {
    await store.update(templateId, {
      name: form.value.name,
      description: form.value.description || undefined,
      isPublic: form.value.isPublic,
      indexMode: form.value.indexMode,
      gcCodeMode: form.value.gcCodeMode,
      difficultyMode: form.value.difficultyMode,
      terrainMode: form.value.terrainMode,
      coordsMode: form.value.coordsMode,
      hintMode: form.value.hintMode,
      spoilerMode: form.value.spoilerMode,
      customField1Label: form.value.customField1Label || undefined,
      customField1Mode: form.value.customField1Mode,
      customField2Label: form.value.customField2Label || undefined,
      customField2Mode: form.value.customField2Mode,
    });
    router.push('/templates');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save template.';
  } finally {
    saving.value = false;
  }
}
</script>
