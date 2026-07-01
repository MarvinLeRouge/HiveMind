<template>
  <div class="container max-w-lg py-8">
    <div class="mb-6 flex items-center gap-4">
      <RouterLink
        :to="`/collections/${store.current?.slug ?? route.params.id}`"
        class="text-sm text-muted-foreground hover:text-foreground"
      >
        {{ t('collection.back') }}
      </RouterLink>
      <h1 class="text-2xl font-bold">{{ t('common.settings') }}</h1>
    </div>

    <form class="space-y-5" @submit.prevent="handleSave">
      <p
        v-if="error"
        role="alert"
        class="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ error }}
      </p>

      <div class="space-y-2">
        <label for="name" class="text-sm font-medium">
          {{ t('collection.name') }}
        </label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div class="space-y-2">
        <label for="description" class="text-sm font-medium">
          {{ t('collection.description') }}
          <span class="text-muted-foreground">{{ t('common.optional') }}</span>
        </label>
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <button
        type="submit"
        :disabled="saving"
        class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ saving ? t('collection.saving') : t('collection.saveChanges') }}
      </button>
    </form>

    <!-- Danger zone -->
    <div class="mt-10 rounded-md border border-destructive/40 p-5">
      <h2 class="mb-2 font-semibold text-destructive">
        {{ t('collection.dangerZone') }}
      </h2>
      <p class="mb-4 text-sm text-muted-foreground">
        {{ t('collection.deleteWarning') }}
      </p>
      <button
        v-if="!confirmDelete"
        class="inline-flex h-9 items-center rounded-md border border-destructive px-4 text-sm font-medium text-destructive hover:bg-destructive/10"
        @click="confirmDelete = true"
      >
        {{ t('collection.delete') }}
      </button>
      <div v-else class="flex items-center gap-3">
        <span class="text-sm">{{ t('collection.confirmDelete') }}</span>
        <button
          :disabled="deleting"
          class="inline-flex h-9 items-center rounded-md bg-destructive px-4 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
          @click="handleDelete"
        >
          {{ deleting ? t('collection.deleting') : t('collection.yesDelete') }}
        </button>
        <button
          class="text-sm text-muted-foreground hover:text-foreground"
          @click="confirmDelete = false"
        >
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useCollectionStore } from '@/stores/collection';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useCollectionStore();

const form = ref({ name: '', description: '' });
const saving = ref(false);
const deleting = ref(false);
const confirmDelete = ref(false);
const error = ref('');

onMounted(async () => {
  if (!store.current || store.current.slug !== route.params.id) {
    await store.fetchById(route.params.id as string);
  }
  if (store.current) {
    form.value.name = store.current.name;
    form.value.description = store.current.description ?? '';
  }
});

/** Saves changes to the collection name and description. */
async function handleSave() {
  error.value = '';
  saving.value = true;
  try {
    await store.update(route.params.id as string, {
      name: form.value.name,
      description: form.value.description || null,
    });
    await router.push(`/collections/${store.current!.slug}`);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save changes.';
  } finally {
    saving.value = false;
  }
}

/** Deletes the collection and redirects to the list. */
async function handleDelete() {
  deleting.value = true;
  try {
    await store.delete(route.params.id as string);
    await router.push('/collections');
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : 'Failed to delete collection.';
    deleting.value = false;
    confirmDelete.value = false;
  }
}
</script>
