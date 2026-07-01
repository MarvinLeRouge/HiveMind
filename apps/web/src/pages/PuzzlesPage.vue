<template>
  <div class="container py-8">
    <p v-if="loadError" role="alert" class="text-sm text-destructive">
      {{ loadError }}
    </p>

    <template v-else>
      <!-- Header -->
      <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <RouterLink
            :to="`/collections/${collectionId}`"
            class="text-sm text-muted-foreground hover:text-foreground"
          >
            {{ t('collection.back') }}
          </RouterLink>
          <h1 class="mt-1 text-2xl font-bold">{{ t('collection.puzzles') }}</h1>
        </div>

        <button
          v-if="isOwner"
          class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          @click="showAddForm = !showAddForm"
        >
          {{ t('puzzle.add') }}
        </button>
      </div>

      <!-- Add puzzle form -->
      <form
        v-if="showAddForm"
        aria-label="Add puzzle"
        class="mb-6 space-y-3 rounded-md border p-4"
        @submit.prevent="handleAdd"
      >
        <!-- Title (always required) -->
        <div class="space-y-1">
          <label for="new-puzzle-title" class="text-sm font-medium">
            {{ t('puzzle.title') }} <span class="text-destructive">*</span>
          </label>
          <input
            id="new-puzzle-title"
            v-model="newForm.title"
            type="text"
            required
            placeholder="Puzzle title"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <!-- Description (always present) -->
        <div class="space-y-1">
          <label for="new-puzzle-description" class="text-sm font-medium">
            {{ t('puzzle.description') }}
          </label>
          <textarea
            id="new-puzzle-description"
            v-model="newForm.description"
            rows="2"
            placeholder="Brief description…"
            class="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <!-- Checker URL (always optional) -->
        <div class="space-y-1">
          <label for="new-puzzle-checker" class="text-sm font-medium">
            {{ t('puzzle.checkerUrl') }}
          </label>
          <input
            id="new-puzzle-checker"
            v-model="newForm.checkerUrl"
            type="url"
            placeholder="https://… (optional)"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <!-- Template-driven fields -->
        <template v-if="template">
          <div v-if="template.gcCodeMode !== 'disabled'" class="space-y-1">
            <label for="new-gc-code" class="text-sm font-medium">
              {{ t('puzzle.gcCode') }}
              <span
                v-if="template.gcCodeMode === 'required'"
                class="text-destructive"
                >*</span
              >
            </label>
            <input
              id="new-gc-code"
              v-model="newForm.gcCode"
              type="text"
              :required="template.gcCodeMode === 'required'"
              placeholder="GC12345"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div v-if="template.difficultyMode !== 'disabled'" class="space-y-1">
            <label for="new-difficulty" class="text-sm font-medium">
              {{ t('puzzle.difficulty') }}
              <span
                v-if="template.difficultyMode === 'required'"
                class="text-destructive"
                >*</span
              >
            </label>
            <input
              id="new-difficulty"
              v-model.number="newForm.difficulty"
              type="number"
              min="1"
              max="5"
              step="0.5"
              :required="template.difficultyMode === 'required'"
              placeholder="e.g. 2.5"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div v-if="template.terrainMode !== 'disabled'" class="space-y-1">
            <label for="new-terrain" class="text-sm font-medium">
              {{ t('puzzle.terrain') }}
              <span
                v-if="template.terrainMode === 'required'"
                class="text-destructive"
                >*</span
              >
            </label>
            <input
              id="new-terrain"
              v-model.number="newForm.terrain"
              type="number"
              min="1"
              max="5"
              step="0.5"
              :required="template.terrainMode === 'required'"
              placeholder="e.g. 1.5"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div v-if="template.coordsMode !== 'disabled'" class="space-y-1">
            <label for="new-coords" class="text-sm font-medium">
              {{ t('puzzle.coords') }}
              <span
                v-if="template.coordsMode === 'required'"
                class="text-destructive"
                >*</span
              >
            </label>
            <input
              id="new-coords"
              v-model="newForm.coords"
              type="text"
              :required="template.coordsMode === 'required'"
              placeholder="N 48° 51.500 E 002° 21.000"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div v-if="template.hintMode !== 'disabled'" class="space-y-1">
            <label for="new-hint" class="text-sm font-medium">
              {{ t('puzzle.hint') }}
              <span
                v-if="template.hintMode === 'required'"
                class="text-destructive"
                >*</span
              >
            </label>
            <textarea
              id="new-hint"
              v-model="newForm.hint"
              rows="2"
              :required="template.hintMode === 'required'"
              class="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div v-if="template.spoilerMode !== 'disabled'" class="space-y-1">
            <label for="new-spoiler" class="text-sm font-medium">
              {{ t('puzzle.spoiler') }}
              <span
                v-if="template.spoilerMode === 'required'"
                class="text-destructive"
                >*</span
              >
            </label>
            <textarea
              id="new-spoiler"
              v-model="newForm.spoiler"
              rows="2"
              :required="template.spoilerMode === 'required'"
              class="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </template>

        <div class="flex items-center gap-3 pt-1">
          <button
            type="submit"
            :disabled="adding"
            class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {{ adding ? '…' : t('common.add') }}
          </button>
          <p v-if="addError" role="alert" class="text-sm text-destructive">
            {{ addError }}
          </p>
        </div>
      </form>

      <!-- Puzzle list -->
      <div v-if="puzzles.length === 0" class="text-sm text-muted-foreground">
        {{ t('puzzle.noItems') }}
      </div>

      <ul v-else aria-label="Puzzle list" class="space-y-2">
        <li
          v-for="(puzzle, index) in puzzles"
          :key="puzzle.id"
          class="flex items-center gap-3 rounded-md border px-4 py-3 text-sm"
          :draggable="isOwner"
          @dragstart="onDragStart(index)"
          @dragover.prevent
          @drop="onDrop(index)"
        >
          <!-- Drag handle -->
          <span
            v-if="isOwner"
            aria-hidden="true"
            class="cursor-grab select-none text-muted-foreground"
            title="Drag to reorder"
          >
            ⠿
          </span>

          <!-- Status badge -->
          <PuzzleStatusBadge :status="puzzle.status" />

          <!-- Title link -->
          <RouterLink
            :to="`/collections/${collectionId}/puzzles/${puzzle.id}`"
            class="flex-1 font-medium hover:underline"
          >
            {{ puzzle.title }}
          </RouterLink>

          <!-- Claim indicator -->
          <span
            v-if="puzzle.workers.length > 0"
            class="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600"
          >
            {{
              puzzle.workers.some((w) => w.id === currentUserId)
                ? t('puzzle.you')
                : t('puzzle.claimed')
            }}
          </span>

          <!-- GC code -->
          <span v-if="puzzle.gcCode" class="text-xs text-muted-foreground">
            {{ puzzle.gcCode }}
          </span>
        </li>
      </ul>
    </template>

    <p v-if="!loadError && loading" class="text-sm text-muted-foreground">
      {{ t('common.loading') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { usePuzzleStore } from '@/stores/puzzle';
import { useCollectionStore } from '@/stores/collection';
import { useAuthStore } from '@/stores/auth';
import PuzzleStatusBadge from '@/components/PuzzleStatusBadge.vue';

const { t } = useI18n();
const route = useRoute();
const collectionId = route.params.id as string;

const puzzleStore = usePuzzleStore();
const collectionStore = useCollectionStore();
const authStore = useAuthStore();

const { puzzles } = storeToRefs(puzzleStore);
const { isOwner, current: collection } = storeToRefs(collectionStore);
const currentUserId = authStore.user?.id;

const template = computed(() => collection.value?.templateSnapshot ?? null);

const loading = ref(true);
const loadError = ref('');
const showAddForm = ref(false);
const adding = ref(false);
const addError = ref('');

const newForm = ref({
  title: '',
  description: '',
  checkerUrl: '',
  gcCode: '',
  difficulty: null as number | null,
  terrain: null as number | null,
  coords: '',
  hint: '',
  spoiler: '',
});

let draggedIndex: number | null = null;

onMounted(async () => {
  try {
    await Promise.all([
      puzzleStore.fetchAll(collectionId),
      collectionStore.fetchById(collectionId),
    ]);
  } catch (e) {
    loadError.value =
      e instanceof Error ? e.message : 'Failed to load puzzles.';
  } finally {
    loading.value = false;
  }
});

/** Starts a drag operation from the given index. */
function onDragStart(index: number) {
  draggedIndex = index;
}

/** Drops the dragged item at the target index and sends a reorder request. */
async function onDrop(targetIndex: number) {
  if (draggedIndex === null || draggedIndex === targetIndex) return;

  const reordered = [...puzzles.value];
  const [moved] = reordered.splice(draggedIndex, 1);
  reordered.splice(targetIndex, 0, moved);

  puzzleStore.puzzles = reordered;
  draggedIndex = null;

  try {
    await puzzleStore.reorder(
      collectionId,
      reordered.map((p, i) => ({ id: p.id, sortOrder: i + 1 })),
    );
  } catch (e) {
    loadError.value =
      e instanceof Error ? e.message : 'Failed to reorder puzzles.';
  }
}

/** Submits the add-puzzle form. */
async function handleAdd() {
  addError.value = '';
  adding.value = true;
  try {
    const f = newForm.value;
    await puzzleStore.create(collectionId, {
      title: f.title,
      ...(f.description ? { description: f.description } : {}),
      ...(f.checkerUrl ? { checkerUrl: f.checkerUrl } : {}),
      ...(f.gcCode ? { gcCode: f.gcCode } : {}),
      ...(f.difficulty != null ? { difficulty: f.difficulty } : {}),
      ...(f.terrain != null ? { terrain: f.terrain } : {}),
      ...(f.coords ? { coords: f.coords } : {}),
      ...(f.hint ? { hint: f.hint } : {}),
      ...(f.spoiler ? { spoiler: f.spoiler } : {}),
    });
    newForm.value = {
      title: '',
      description: '',
      checkerUrl: '',
      gcCode: '',
      difficulty: null,
      terrain: null,
      coords: '',
      hint: '',
      spoiler: '',
    };
    showAddForm.value = false;
  } catch (e) {
    addError.value = e instanceof Error ? e.message : 'Failed to add puzzle.';
  } finally {
    adding.value = false;
  }
}
</script>
