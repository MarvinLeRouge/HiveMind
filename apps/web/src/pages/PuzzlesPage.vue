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
            ← Collection
          </RouterLink>
          <h1 class="mt-1 text-2xl font-bold">Puzzles</h1>
        </div>

        <button
          v-if="isOwner"
          class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          @click="showAddForm = !showAddForm"
        >
          + Add puzzle
        </button>
      </div>

      <!-- Add puzzle form -->
      <form
        v-if="showAddForm"
        aria-label="Add puzzle"
        class="mb-6 flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:flex-wrap"
        @submit.prevent="handleAdd"
      >
        <label for="new-puzzle-title" class="sr-only">Puzzle title</label>
        <input
          id="new-puzzle-title"
          v-model="newTitle"
          type="text"
          required
          placeholder="Puzzle title"
          class="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <label for="new-puzzle-checker" class="sr-only">Checker URL</label>
        <input
          id="new-puzzle-checker"
          v-model="newCheckerUrl"
          type="url"
          placeholder="Checker URL (optional)"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring sm:w-64"
        />
        <button
          type="submit"
          :disabled="adding"
          class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
        >
          {{ adding ? 'Adding…' : 'Add' }}
        </button>
        <p v-if="addError" role="alert" class="text-sm text-destructive">
          {{ addError }}
        </p>
      </form>

      <!-- Puzzle list -->
      <div v-if="puzzles.length === 0" class="text-sm text-muted-foreground">
        No puzzles yet.
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
            v-if="puzzle.workingOnId"
            class="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600"
          >
            {{ puzzle.workingOnId === currentUserId ? 'You' : 'Claimed' }}
          </span>

          <!-- GC code -->
          <span v-if="puzzle.gcCode" class="text-xs text-muted-foreground">
            {{ puzzle.gcCode }}
          </span>
        </li>
      </ul>
    </template>

    <p v-if="!loadError && loading" class="text-sm text-muted-foreground">
      Loading…
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { usePuzzleStore } from '@/stores/puzzle';
import { useCollectionStore } from '@/stores/collection';
import { useAuthStore } from '@/stores/auth';
import PuzzleStatusBadge from '@/components/PuzzleStatusBadge.vue';

const route = useRoute();
const collectionId = route.params.id as string;

const puzzleStore = usePuzzleStore();
const collectionStore = useCollectionStore();
const authStore = useAuthStore();

const { puzzles } = storeToRefs(puzzleStore);
const { isOwner } = storeToRefs(collectionStore);
const currentUserId = authStore.user?.id;

const loading = ref(true);
const loadError = ref('');
const showAddForm = ref(false);
const newTitle = ref('');
const newCheckerUrl = ref('');
const adding = ref(false);
const addError = ref('');

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
    await puzzleStore.create(collectionId, {
      title: newTitle.value,
      ...(newCheckerUrl.value ? { checkerUrl: newCheckerUrl.value } : {}),
    });
    newTitle.value = '';
    newCheckerUrl.value = '';
    showAddForm.value = false;
  } catch (e) {
    addError.value = e instanceof Error ? e.message : 'Failed to add puzzle.';
  } finally {
    adding.value = false;
  }
}
</script>
