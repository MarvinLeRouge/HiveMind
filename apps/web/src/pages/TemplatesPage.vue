<template>
  <div class="container py-8">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Templates</h1>
      <RouterLink
        to="/templates/new"
        class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        + New template
      </RouterLink>
    </div>

    <p v-if="loadError" role="alert" class="text-sm text-destructive">
      {{ loadError }}
    </p>

    <div
      v-else-if="templates.length === 0 && !loading"
      class="text-sm text-muted-foreground"
    >
      No templates yet.
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="t in templates"
        :key="t.id"
        class="flex items-center gap-3 rounded-md border px-4 py-3 text-sm"
      >
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ t.name }}</span>
            <span
              v-if="t.isSystem"
              class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
            >
              system
            </span>
            <span
              v-if="t.isPublic"
              class="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-700"
            >
              public
            </span>
          </div>
          <p v-if="t.description" class="mt-0.5 text-xs text-muted-foreground">
            {{ t.description }}
          </p>
          <p class="mt-0.5 text-xs text-muted-foreground">
            Fields:
            <span v-if="activeFields(t).length">{{
              activeFields(t).join(', ')
            }}</span>
            <span v-else>none</span>
          </p>
        </div>

        <div v-if="canEdit(t)" class="flex shrink-0 gap-3">
          <RouterLink
            :to="`/templates/${t.id}/edit`"
            class="text-xs text-muted-foreground hover:text-foreground"
          >
            Edit
          </RouterLink>
          <button
            class="text-xs text-destructive hover:underline"
            @click="handleDelete(t.id)"
          >
            Delete
          </button>
        </div>
      </li>
    </ul>

    <p v-if="loading" class="text-sm text-muted-foreground">Loading…</p>

    <p v-if="deleteError" role="alert" class="mt-4 text-sm text-destructive">
      {{ deleteError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useTemplateStore } from '@/stores/template';
import { useAuthStore } from '@/stores/auth';
import type { Template } from '@/types/template';

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
function canEdit(t: Template): boolean {
  if (auth.user?.isAdmin) return true;
  return t.createdBy === auth.user?.id;
}

/** Returns the list of active boolean field labels for display. */
function activeFields(t: Template): string[] {
  const map: [keyof Template, string][] = [
    ['useIndex', 'Index'],
    ['useGcCode', 'GC code'],
    ['useDifficulty', 'Difficulty'],
    ['useTerrain', 'Terrain'],
    ['useCoords', 'Coords'],
    ['useHint', 'Hint'],
    ['useSpoiler', 'Spoiler'],
  ];
  const fields = map.filter(([key]) => t[key]).map(([, label]) => label);
  if (t.customField1Label) fields.push(t.customField1Label);
  if (t.customField2Label) fields.push(t.customField2Label);
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
