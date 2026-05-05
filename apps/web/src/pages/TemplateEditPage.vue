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

        <!-- Fields -->
        <fieldset class="space-y-3 rounded-md border p-4">
          <legend class="px-1 text-sm font-medium">Puzzle fields</legend>

          <div
            v-for="field in booleanFields"
            :key="field.key"
            class="flex items-center gap-2"
          >
            <input
              :id="field.key"
              v-model="form[field.key]"
              type="checkbox"
              class="h-4 w-4 rounded border-input"
            />
            <label :for="field.key" class="text-sm">{{ field.label }}</label>
          </div>

          <div class="pt-2 space-y-2">
            <div class="space-y-1">
              <label
                for="customField1Label"
                class="text-xs font-medium text-muted-foreground"
              >
                Custom field 1 label (optional, max 32 chars)
              </label>
              <input
                id="customField1Label"
                v-model="form.customField1Label"
                type="text"
                maxlength="32"
                class="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div class="space-y-1">
              <label
                for="customField2Label"
                class="text-xs font-medium text-muted-foreground"
              >
                Custom field 2 label (optional, max 32 chars)
              </label>
              <input
                id="customField2Label"
                v-model="form.customField2Label"
                type="text"
                maxlength="32"
                class="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
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

const route = useRoute();
const router = useRouter();
const store = useTemplateStore();

const templateId = route.params.id as string;
const saving = ref(false);
const loadError = ref('');
const error = ref('');

const form = ref<{
  name: string;
  description: string;
  isPublic: boolean;
  useIndex: boolean;
  useGcCode: boolean;
  useDifficulty: boolean;
  useTerrain: boolean;
  useCoords: boolean;
  useHint: boolean;
  useSpoiler: boolean;
  customField1Label: string;
  customField2Label: string;
} | null>(null);

const booleanFields = [
  { key: 'useIndex' as const, label: 'Index number' },
  { key: 'useGcCode' as const, label: 'GC code' },
  { key: 'useDifficulty' as const, label: 'Difficulty rating' },
  { key: 'useTerrain' as const, label: 'Terrain rating' },
  { key: 'useCoords' as const, label: 'Coordinates' },
  { key: 'useHint' as const, label: 'Hint' },
  { key: 'useSpoiler' as const, label: 'Spoiler' },
];

onMounted(async () => {
  try {
    await store.fetchById(templateId);
    const t = store.current!;
    form.value = {
      name: t.name,
      description: t.description ?? '',
      isPublic: t.isPublic,
      useIndex: t.useIndex,
      useGcCode: t.useGcCode,
      useDifficulty: t.useDifficulty,
      useTerrain: t.useTerrain,
      useCoords: t.useCoords,
      useHint: t.useHint,
      useSpoiler: t.useSpoiler,
      customField1Label: t.customField1Label ?? '',
      customField2Label: t.customField2Label ?? '',
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
      useIndex: form.value.useIndex,
      useGcCode: form.value.useGcCode,
      useDifficulty: form.value.useDifficulty,
      useTerrain: form.value.useTerrain,
      useCoords: form.value.useCoords,
      useHint: form.value.useHint,
      useSpoiler: form.value.useSpoiler,
      customField1Label: form.value.customField1Label || undefined,
      customField2Label: form.value.customField2Label || undefined,
    });
    router.push('/templates');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save template.';
  } finally {
    saving.value = false;
  }
}
</script>
