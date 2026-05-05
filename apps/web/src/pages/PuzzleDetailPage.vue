<template>
  <div class="container py-8">
    <p v-if="loadError" role="alert" class="text-sm text-destructive">
      {{ loadError }}
    </p>

    <template v-else-if="current">
      <!-- Header -->
      <div class="mb-6 flex items-start justify-between">
        <div>
          <RouterLink
            :to="`/collections/${collectionId}/puzzles`"
            class="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Puzzles
          </RouterLink>
          <div class="mt-1 flex items-center gap-3">
            <h1 class="text-2xl font-bold">{{ current.title }}</h1>
            <PuzzleStatusBadge :status="current.status" />
          </div>
        </div>

        <!-- Status advance + claim/unclaim -->
        <div class="flex items-center gap-2">
          <button
            v-if="isClaimed"
            class="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            :disabled="claimBusy"
            @click="handleUnclaim"
          >
            {{ claimBusy ? '…' : 'Release' }}
          </button>
          <button
            v-else-if="!current.workingOnId"
            class="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            :disabled="claimBusy"
            @click="handleClaim"
          >
            {{ claimBusy ? '…' : 'Claim' }}
          </button>

          <button
            v-if="nextStatus"
            class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
            :disabled="statusBusy"
            @click="handleAdvanceStatus"
          >
            {{ statusBusy ? '…' : `Mark as ${STATUS_LABELS[nextStatus]}` }}
          </button>
        </div>
      </div>

      <!-- Fields grid -->
      <div class="mb-6 grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-3">
        <div v-if="current.gcCode">
          <span class="font-medium text-muted-foreground">GC Code</span>
          <p>{{ current.gcCode }}</p>
        </div>
        <div v-if="current.coords">
          <span class="font-medium text-muted-foreground">Coords</span>
          <p class="font-mono">{{ current.coords }}</p>
        </div>
        <div v-if="current.difficulty != null">
          <span class="font-medium text-muted-foreground">Difficulty</span>
          <p>{{ current.difficulty }} / 5</p>
        </div>
        <div v-if="current.terrain != null">
          <span class="font-medium text-muted-foreground">Terrain</span>
          <p>{{ current.terrain }} / 5</p>
        </div>
        <div v-if="current.checkerUrl">
          <span class="font-medium text-muted-foreground">Checker</span>
          <a
            :href="current.checkerUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary underline hover:no-underline"
          >
            Open checker
          </a>
        </div>
        <div v-if="current.hint">
          <span class="font-medium text-muted-foreground">Hint</span>
          <p>{{ current.hint }}</p>
        </div>
        <div v-if="current.spoiler">
          <span class="font-medium text-muted-foreground">Spoiler</span>
          <details>
            <summary class="cursor-pointer text-muted-foreground">
              Show spoiler
            </summary>
            <p class="mt-1">{{ current.spoiler }}</p>
          </details>
        </div>
      </div>

      <!-- Tabs -->
      <div role="tablist" class="mb-4 flex gap-4 border-b">
        <button
          role="tab"
          :aria-selected="activeTab === 'notes'"
          class="pb-2 text-sm font-medium"
          :class="
            activeTab === 'notes'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="activeTab = 'notes'"
        >
          Notes
        </button>
        <button
          role="tab"
          :aria-selected="activeTab === 'attempts'"
          class="pb-2 text-sm font-medium"
          :class="
            activeTab === 'attempts'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="activeTab = 'attempts'"
        >
          Attempts
        </button>
      </div>

      <!-- Notes tab -->
      <section v-if="activeTab === 'notes'" role="tabpanel" aria-label="Notes">
        <ul class="mb-4 space-y-3">
          <li
            v-for="note in notes"
            :key="note.id"
            class="rounded-md border px-4 py-3 text-sm"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1">
                <p v-if="editingNoteId !== note.id">{{ note.content }}</p>
                <textarea
                  v-else
                  v-model="editNoteContent"
                  rows="3"
                  class="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div
                v-if="note.userId === currentUserId"
                class="flex shrink-0 gap-2"
              >
                <template v-if="editingNoteId !== note.id">
                  <button
                    class="text-xs text-muted-foreground hover:text-foreground"
                    @click="startEditNote(note)"
                  >
                    Edit
                  </button>
                  <button
                    class="text-xs text-destructive hover:underline"
                    @click="handleDeleteNote(note.id)"
                  >
                    Delete
                  </button>
                </template>
                <template v-else>
                  <button
                    class="text-xs font-medium text-primary hover:underline"
                    @click="handleSaveNote(note.id)"
                  >
                    Save
                  </button>
                  <button
                    class="text-xs text-muted-foreground hover:text-foreground"
                    @click="editingNoteId = null"
                  >
                    Cancel
                  </button>
                </template>
              </div>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ new Date(note.updatedAt).toLocaleString() }}
            </p>
          </li>
        </ul>

        <form
          aria-label="Add note"
          class="flex gap-3"
          @submit.prevent="handleAddNote"
        >
          <label for="new-note-content" class="sr-only">Note content</label>
          <textarea
            id="new-note-content"
            v-model="newNoteContent"
            rows="2"
            required
            placeholder="Add a note…"
            class="flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            :disabled="addingNote"
            class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {{ addingNote ? '…' : 'Add note' }}
          </button>
        </form>
        <p v-if="noteError" role="alert" class="mt-1 text-sm text-destructive">
          {{ noteError }}
        </p>
      </section>

      <!-- Attempts tab -->
      <section
        v-if="activeTab === 'attempts'"
        role="tabpanel"
        aria-label="Attempts"
      >
        <ul class="mb-4 space-y-2">
          <li
            v-for="attempt in attempts"
            :key="attempt.id"
            class="flex items-center gap-3 rounded-md border px-4 py-3 text-sm"
          >
            <span
              class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="
                attempt.checkerResult
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              "
            >
              <span aria-hidden="true">{{
                attempt.checkerResult ? '✓' : '✗'
              }}</span>
              <span class="sr-only">{{
                attempt.checkerResult ? 'Correct' : 'Incorrect'
              }}</span>
            </span>
            <span class="font-mono">{{ attempt.valueTested }}</span>
            <span v-if="attempt.comment" class="text-muted-foreground">
              — {{ attempt.comment }}
            </span>
            <span class="ml-auto text-xs text-muted-foreground">
              {{ new Date(attempt.createdAt).toLocaleString() }}
            </span>
          </li>
        </ul>
        <p
          v-if="attempts.length === 0"
          class="mb-4 text-sm text-muted-foreground"
        >
          No attempts yet.
        </p>

        <form
          aria-label="Record attempt"
          class="flex gap-3"
          @submit.prevent="handleAddAttempt"
        >
          <label for="attempt-value" class="sr-only">Value to test</label>
          <input
            id="attempt-value"
            v-model="newAttemptValue"
            type="text"
            required
            placeholder="Value to test"
            class="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <label for="attempt-result" class="sr-only">Result</label>
          <select
            id="attempt-result"
            v-model="newAttemptResult"
            class="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option :value="true">✓ Correct</option>
            <option :value="false">✗ Incorrect</option>
          </select>
          <label for="attempt-comment" class="sr-only">Comment</label>
          <input
            id="attempt-comment"
            v-model="newAttemptComment"
            type="text"
            placeholder="Comment (optional)"
            class="flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            :disabled="addingAttempt"
            class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {{ addingAttempt ? '…' : 'Record' }}
          </button>
        </form>
        <p
          v-if="attemptError"
          role="alert"
          class="mt-1 text-sm text-destructive"
        >
          {{ attemptError }}
        </p>
      </section>
    </template>

    <p v-else-if="!loadError" class="text-sm text-muted-foreground">Loading…</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { usePuzzleStore } from '@/stores/puzzle';
import { useNoteStore } from '@/stores/note';
import { useAttemptStore } from '@/stores/attempt';
import { useAuthStore } from '@/stores/auth';
import PuzzleStatusBadge from '@/components/PuzzleStatusBadge.vue';
import { STATUS_NEXT, STATUS_LABELS } from '@/types/puzzle';
import type { Note } from '@/types/note';

const route = useRoute();
const collectionId = route.params.id as string;
const puzzleId = route.params.pid as string;

const puzzleStore = usePuzzleStore();
const noteStore = useNoteStore();
const attemptStore = useAttemptStore();
const authStore = useAuthStore();

const { current } = storeToRefs(puzzleStore);
const { notes } = storeToRefs(noteStore);
const { attempts } = storeToRefs(attemptStore);
const currentUserId = authStore.user?.id;

const loadError = ref('');
const activeTab = ref<'notes' | 'attempts'>('notes');
const statusBusy = ref(false);
const claimBusy = ref(false);

const newNoteContent = ref('');
const addingNote = ref(false);
const noteError = ref('');
const editingNoteId = ref<string | null>(null);
const editNoteContent = ref('');

const newAttemptValue = ref('');
const newAttemptResult = ref<boolean>(false);
const newAttemptComment = ref('');
const addingAttempt = ref(false);
const attemptError = ref('');

const nextStatus = computed(() =>
  current.value ? (STATUS_NEXT[current.value.status] ?? null) : null,
);

const isClaimed = computed(() => current.value?.workingOnId === currentUserId);

onMounted(async () => {
  try {
    await Promise.all([
      puzzleStore.fetchById(collectionId, puzzleId),
      noteStore.fetchAll(puzzleId),
      attemptStore.fetchAll(puzzleId),
    ]);
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Failed to load puzzle.';
  }
});

/** Advances the puzzle to the next status. */
async function handleAdvanceStatus() {
  if (!nextStatus.value) return;
  statusBusy.value = true;
  try {
    await puzzleStore.update(collectionId, puzzleId, {
      status: nextStatus.value,
    });
  } finally {
    statusBusy.value = false;
  }
}

/** Claims the puzzle for the current user. */
async function handleClaim() {
  claimBusy.value = true;
  try {
    await puzzleStore.claim(collectionId, puzzleId);
  } finally {
    claimBusy.value = false;
  }
}

/** Releases the puzzle claim. */
async function handleUnclaim() {
  claimBusy.value = true;
  try {
    await puzzleStore.unclaim(collectionId, puzzleId);
  } finally {
    claimBusy.value = false;
  }
}

/** Submits a new note. */
async function handleAddNote() {
  noteError.value = '';
  addingNote.value = true;
  try {
    await noteStore.add(puzzleId, newNoteContent.value);
    newNoteContent.value = '';
  } catch (e) {
    noteError.value = e instanceof Error ? e.message : 'Failed to add note.';
  } finally {
    addingNote.value = false;
  }
}

/** Begins editing a note inline. */
function startEditNote(note: Note) {
  editingNoteId.value = note.id;
  editNoteContent.value = note.content;
}

/** Saves an edited note. */
async function handleSaveNote(noteId: string) {
  try {
    await noteStore.update(puzzleId, noteId, editNoteContent.value);
    editingNoteId.value = null;
  } catch (e) {
    noteError.value = e instanceof Error ? e.message : 'Failed to update note.';
  }
}

/** Deletes a note. */
async function handleDeleteNote(noteId: string) {
  try {
    await noteStore.delete(puzzleId, noteId);
  } catch (e) {
    noteError.value = e instanceof Error ? e.message : 'Failed to delete note.';
  }
}

/** Records a new attempt. */
async function handleAddAttempt() {
  attemptError.value = '';
  addingAttempt.value = true;
  try {
    await attemptStore.add(puzzleId, {
      valueTested: newAttemptValue.value,
      checkerResult: newAttemptResult.value,
      ...(newAttemptComment.value ? { comment: newAttemptComment.value } : {}),
    });
    newAttemptValue.value = '';
    newAttemptResult.value = false;
    newAttemptComment.value = '';
  } catch (e) {
    attemptError.value =
      e instanceof Error ? e.message : 'Failed to record attempt.';
  } finally {
    addingAttempt.value = false;
  }
}
</script>
