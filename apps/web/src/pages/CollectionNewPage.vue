<template>
  <div class="container max-w-lg py-8">
    <div class="mb-6 flex items-center gap-4">
      <RouterLink
        to="/collections"
        class="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Collections
      </RouterLink>
      <h1 class="text-2xl font-bold">New collection</h1>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <p
        v-if="error"
        role="alert"
        class="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ error }}
      </p>

      <div class="space-y-2">
        <label for="name" class="text-sm font-medium">Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          placeholder="My puzzle series"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div class="space-y-2">
        <label for="description" class="text-sm font-medium">
          Description <span class="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          placeholder="A short description…"
          class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div class="space-y-2">
        <label for="template" class="text-sm font-medium">Template</label>
        <select
          id="template"
          v-model="form.templateId"
          required
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="" disabled>Select a template…</option>
          <option v-for="t in templates" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
      </div>

      <div class="flex gap-3">
        <RouterLink
          to="/collections"
          class="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </RouterLink>
        <button
          type="submit"
          :disabled="loading"
          class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Creating…' : 'Create collection' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCollectionStore } from '@/stores/collection';
import { useTemplateStore } from '@/stores/template';
import { storeToRefs } from 'pinia';

const router = useRouter();
const collectionStore = useCollectionStore();
const templateStore = useTemplateStore();
const { templates } = storeToRefs(templateStore);

const form = ref({ name: '', description: '', templateId: '' });
const loading = ref(false);
const error = ref('');

onMounted(async () => {
  try {
    await templateStore.fetchAll();
  } catch {
    error.value = 'Failed to load templates.';
  }
});

/** Creates the collection and redirects to its detail page. */
async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    const collection = await collectionStore.create({
      name: form.value.name,
      description: form.value.description || undefined,
      templateId: form.value.templateId,
    });
    await router.push(`/collections/${collection.id}`);
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : 'Failed to create collection.';
  } finally {
    loading.value = false;
  }
}
</script>
