<template>
  <div class="container max-w-2xl py-8">
    <RouterLink
      to="/templates"
      class="text-sm text-muted-foreground hover:text-foreground"
    >
      ← Templates
    </RouterLink>

    <p v-if="loadError" role="alert" class="mt-4 text-sm text-destructive">
      {{ loadError }}
    </p>

    <template v-else-if="form">
      <h1 class="mt-2 text-2xl font-bold">Edit template</h1>

      <form class="mt-6 space-y-6" @submit.prevent="handleSubmit">
        <!-- Name -->
        <div class="space-y-1">
          <label for="name" class="text-sm font-medium">Name</label>
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
            Description
            <span class="text-muted-foreground">(optional)</span>
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
            Public (visible to all users)
          </label>
        </div>

        <!-- Puzzle fields -->
        <fieldset class="space-y-3 rounded-md border p-4">
          <legend class="px-1 text-sm font-medium">Puzzle fields</legend>

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
              <option value="disabled">Disabled</option>
              <option value="optional">Optional</option>
              <option value="required">Required</option>
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
              <option value="disabled">Disabled</option>
              <option value="optional">Optional</option>
              <option value="required">Required</option>
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
            {{ saving ? 'Saving…' : 'Save changes' }}
          </button>
          <RouterLink
            to="/templates"
            class="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </RouterLink>
        </div>
      </form>
    </template>

    <p v-else class="mt-4 text-sm text-muted-foreground">Loading…</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTemplateStore } from '@/stores/template';
import type { FieldMode } from '@/types/template';

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

const modeFields: {
  key: keyof Pick<
    FormShape,
    | 'indexMode'
    | 'gcCodeMode'
    | 'difficultyMode'
    | 'terrainMode'
    | 'coordsMode'
    | 'hintMode'
    | 'spoilerMode'
  >;
  label: string;
}[] = [
  { key: 'indexMode', label: 'Index number' },
  { key: 'gcCodeMode', label: 'GC code' },
  { key: 'difficultyMode', label: 'Difficulty rating' },
  { key: 'terrainMode', label: 'Terrain rating' },
  { key: 'coordsMode', label: 'Coordinates' },
  { key: 'hintMode', label: 'Hint' },
  { key: 'spoilerMode', label: 'Spoiler' },
];

const customFields: {
  label: string;
  labelKey: 'customField1Label' | 'customField2Label';
  modeKey: 'customField1Mode' | 'customField2Mode';
  placeholder: string;
}[] = [
  {
    label: 'Custom field 1',
    labelKey: 'customField1Label',
    modeKey: 'customField1Mode',
    placeholder: 'Zone',
  },
  {
    label: 'Custom field 2',
    labelKey: 'customField2Label',
    modeKey: 'customField2Mode',
    placeholder: 'Reference',
  },
];

onMounted(async () => {
  try {
    await store.fetchById(templateId);
    const t = store.current!;
    form.value = {
      name: t.name,
      description: t.description ?? '',
      isPublic: t.isPublic,
      indexMode: t.indexMode,
      gcCodeMode: t.gcCodeMode,
      difficultyMode: t.difficultyMode,
      terrainMode: t.terrainMode,
      coordsMode: t.coordsMode,
      hintMode: t.hintMode,
      spoilerMode: t.spoilerMode,
      customField1Label: t.customField1Label ?? '',
      customField1Mode: t.customField1Mode,
      customField2Label: t.customField2Label ?? '',
      customField2Mode: t.customField2Mode,
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
