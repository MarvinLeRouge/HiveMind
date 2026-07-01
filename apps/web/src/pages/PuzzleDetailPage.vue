<template>
  <div class="container py-8">
    <p v-if="loadError" role="alert" class="text-sm text-destructive">
      {{ loadError }}
    </p>

    <template v-else-if="current">
      <!-- Header -->
      <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <RouterLink
            :to="`/collections/${collectionId}/puzzles`"
            class="text-sm text-muted-foreground hover:text-foreground"
          >
            {{ t('puzzle.back') }}
          </RouterLink>
          <div class="mt-1 flex items-center gap-3">
            <h1 class="text-2xl font-bold">{{ current.title }}</h1>
            <PuzzleStatusBadge :status="current.status" />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            v-if="isClaimed"
            class="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            :disabled="claimBusy"
            @click="handleUnclaim"
          >
            {{ claimBusy ? '…' : t('puzzle.release') }}
          </button>
          <button
            v-else-if="!current.workingOnId"
            class="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            :disabled="claimBusy"
            @click="handleClaim"
          >
            {{ claimBusy ? '…' : t('puzzle.claim') }}
          </button>

          <button
            v-if="nextStatus"
            class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
            :disabled="statusBusy"
            @click="handleAdvanceStatus"
          >
            {{
              statusBusy ? '…' : t('puzzle.markAs', { status: nextStatusLabel })
            }}
          </button>

          <button
            v-if="!editing"
            class="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            @click="startEdit"
          >
            {{ t('common.edit') }}
          </button>
        </div>
      </div>

      <!-- View mode -->
      <template v-if="!editing">
        <!-- Description -->
        <div v-if="current.description" class="mb-4 text-sm">
          <p class="font-medium text-muted-foreground">
            {{ t('puzzle.description') }}
          </p>
          <p class="mt-1 whitespace-pre-wrap">{{ current.description }}</p>
        </div>

        <!-- Template-driven fields grid -->
        <div
          v-if="hasVisibleFields"
          class="mb-6 grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2 md:grid-cols-3"
        >
          <div v-if="current.gcCode">
            <span class="font-medium text-muted-foreground">{{
              t('puzzle.gcCode')
            }}</span>
            <p>{{ current.gcCode }}</p>
          </div>
          <div v-if="current.coords">
            <span class="font-medium text-muted-foreground">{{
              t('puzzle.coords')
            }}</span>
            <p class="font-mono">{{ current.coords }}</p>
          </div>
          <div v-if="current.difficulty != null">
            <span class="font-medium text-muted-foreground">{{
              t('puzzle.difficulty')
            }}</span>
            <p>{{ current.difficulty }} / 5</p>
          </div>
          <div v-if="current.terrain != null">
            <span class="font-medium text-muted-foreground">{{
              t('puzzle.terrain')
            }}</span>
            <p>{{ current.terrain }} / 5</p>
          </div>
          <div v-if="current.checkerUrl">
            <span class="font-medium text-muted-foreground">{{
              t('puzzle.checkerUrl')
            }}</span>
            <a
              :href="current.checkerUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary underline hover:no-underline"
            >
              {{ t('puzzle.openChecker') }}
            </a>
          </div>
          <div v-if="current.hint">
            <span class="font-medium text-muted-foreground">{{
              t('puzzle.hint')
            }}</span>
            <p>{{ current.hint }}</p>
          </div>
          <div v-if="current.spoiler">
            <span class="font-medium text-muted-foreground">{{
              t('puzzle.spoiler')
            }}</span>
            <details>
              <summary class="cursor-pointer text-muted-foreground">
                {{ t('puzzle.showSpoiler') }}
              </summary>
              <p class="mt-1">{{ current.spoiler }}</p>
            </details>
          </div>
        </div>
      </template>

      <!-- Edit mode -->
      <form
        v-else
        aria-label="Edit puzzle"
        class="mb-6 space-y-4 rounded-md border p-4"
        @submit.prevent="handleSaveEdit"
      >
        <!-- Title -->
        <div class="space-y-1">
          <label for="edit-title" class="text-sm font-medium">
            {{ t('puzzle.title') }} <span class="text-destructive">*</span>
          </label>
          <input
            id="edit-title"
            v-model="editForm.title"
            type="text"
            required
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <!-- Description -->
        <div class="space-y-1">
          <label for="edit-description" class="text-sm font-medium">
            {{ t('puzzle.description') }}
          </label>
          <textarea
            id="edit-description"
            v-model="editForm.description"
            rows="3"
            class="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <!-- Checker URL -->
        <div class="space-y-1">
          <label for="edit-checker" class="text-sm font-medium">
            {{ t('puzzle.checkerUrl') }}
          </label>
          <input
            id="edit-checker"
            v-model="editForm.checkerUrl"
            type="url"
            placeholder="https://… (optional)"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <!-- Template-driven fields -->
        <template v-if="template">
          <div v-if="template.gcCodeMode !== 'disabled'" class="space-y-1">
            <label for="edit-gc-code" class="text-sm font-medium">
              {{ t('puzzle.gcCode') }}
              <span
                v-if="template.gcCodeMode === 'required'"
                class="text-destructive"
                >*</span
              >
            </label>
            <input
              id="edit-gc-code"
              v-model="editForm.gcCode"
              type="text"
              :required="template.gcCodeMode === 'required'"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div v-if="template.difficultyMode !== 'disabled'" class="space-y-1">
            <label for="edit-difficulty" class="text-sm font-medium">
              {{ t('puzzle.difficulty') }}
              <span
                v-if="template.difficultyMode === 'required'"
                class="text-destructive"
                >*</span
              >
            </label>
            <input
              id="edit-difficulty"
              v-model.number="editForm.difficulty"
              type="number"
              min="1"
              max="5"
              step="0.5"
              :required="template.difficultyMode === 'required'"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div v-if="template.terrainMode !== 'disabled'" class="space-y-1">
            <label for="edit-terrain" class="text-sm font-medium">
              {{ t('puzzle.terrain') }}
              <span
                v-if="template.terrainMode === 'required'"
                class="text-destructive"
                >*</span
              >
            </label>
            <input
              id="edit-terrain"
              v-model.number="editForm.terrain"
              type="number"
              min="1"
              max="5"
              step="0.5"
              :required="template.terrainMode === 'required'"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div v-if="template.coordsMode !== 'disabled'" class="space-y-1">
            <label for="edit-coords" class="text-sm font-medium">
              {{ t('puzzle.coords') }}
              <span
                v-if="template.coordsMode === 'required'"
                class="text-destructive"
                >*</span
              >
            </label>
            <input
              id="edit-coords"
              v-model="editForm.coords"
              type="text"
              :required="template.coordsMode === 'required'"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div v-if="template.hintMode !== 'disabled'" class="space-y-1">
            <label for="edit-hint" class="text-sm font-medium">
              {{ t('puzzle.hint') }}
              <span
                v-if="template.hintMode === 'required'"
                class="text-destructive"
                >*</span
              >
            </label>
            <textarea
              id="edit-hint"
              v-model="editForm.hint"
              rows="2"
              :required="template.hintMode === 'required'"
              class="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div v-if="template.spoilerMode !== 'disabled'" class="space-y-1">
            <label for="edit-spoiler" class="text-sm font-medium">
              {{ t('puzzle.spoiler') }}
              <span
                v-if="template.spoilerMode === 'required'"
                class="text-destructive"
                >*</span
              >
            </label>
            <textarea
              id="edit-spoiler"
              v-model="editForm.spoiler"
              rows="2"
              :required="template.spoilerMode === 'required'"
              class="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </template>

        <p v-if="editError" role="alert" class="text-sm text-destructive">
          {{ editError }}
        </p>

        <div class="flex gap-3">
          <button
            type="submit"
            :disabled="editSaving"
            class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {{ editSaving ? t('common.saving') : t('common.save') }}
          </button>
          <button
            type="button"
            class="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            @click="editing = false"
          >
            {{ t('common.cancel') }}
          </button>
        </div>
      </form>

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
          {{ t('puzzle.addNote') }}s
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
                    {{ t('common.edit') }}
                  </button>
                  <button
                    class="text-xs text-destructive hover:underline"
                    @click="handleDeleteNote(note.id)"
                  >
                    {{ t('common.delete') }}
                  </button>
                </template>
                <template v-else>
                  <button
                    class="text-xs font-medium text-primary hover:underline"
                    @click="handleSaveNote(note.id)"
                  >
                    {{ t('common.save') }}
                  </button>
                  <button
                    class="text-xs text-muted-foreground hover:text-foreground"
                    @click="editingNoteId = null"
                  >
                    {{ t('common.cancel') }}
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
          class="flex flex-col gap-3 sm:flex-row sm:items-start"
          @submit.prevent="handleAddNote"
        >
          <label for="new-note-content" class="sr-only">Note content</label>
          <textarea
            id="new-note-content"
            v-model="newNoteContent"
            rows="2"
            required
            :placeholder="t('puzzle.addNoteAction')"
            class="flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            :disabled="addingNote"
            class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {{ addingNote ? '…' : t('puzzle.addNote') }}
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
                attempt.checkerResult
                  ? t('puzzle.status.solved')
                  : t('puzzle.status.open')
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
          {{ t('puzzle.noAttempts') }}
        </p>

        <form
          aria-label="Record attempt"
          class="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
          @submit.prevent="handleAddAttempt"
        >
          <label for="attempt-value" class="sr-only">Value to test</label>
          <input
            id="attempt-value"
            v-model="newAttemptValue"
            type="text"
            required
            :placeholder="t('puzzle.valueTested')"
            class="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <label for="attempt-result" class="sr-only">Result</label>
          <select
            id="attempt-result"
            v-model="newAttemptResult"
            class="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option :value="true">✓ {{ t('puzzle.status.solved') }}</option>
            <option :value="false">✗ {{ t('puzzle.status.open') }}</option>
          </select>
          <label for="attempt-comment" class="sr-only">Comment</label>
          <input
            id="attempt-comment"
            v-model="newAttemptComment"
            type="text"
            :placeholder="t('puzzle.comment')"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring sm:w-48"
          />
          <button
            type="submit"
            :disabled="addingAttempt"
            class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {{ addingAttempt ? '…' : t('puzzle.record') }}
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

    <p v-else-if="!loadError" class="text-sm text-muted-foreground">
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
import { useNoteStore } from '@/stores/note';
import { useAttemptStore } from '@/stores/attempt';
import { useAuthStore } from '@/stores/auth';
import { useCollectionStore } from '@/stores/collection';
import PuzzleStatusBadge from '@/components/PuzzleStatusBadge.vue';
import { STATUS_NEXT } from '@/types/puzzle';
import type { Note } from '@/types/note';

const { t } = useI18n();
const route = useRoute();
const collectionId = route.params.id as string;
const puzzleId = route.params.pid as string;

const puzzleStore = usePuzzleStore();
const noteStore = useNoteStore();
const attemptStore = useAttemptStore();
const authStore = useAuthStore();
const collectionStore = useCollectionStore();

const { current } = storeToRefs(puzzleStore);
const { current: collection } = storeToRefs(collectionStore);
const { notes } = storeToRefs(noteStore);
const { attempts } = storeToRefs(attemptStore);
const currentUserId = authStore.user?.id;

const template = computed(() => collection.value?.templateSnapshot ?? null);

const hasVisibleFields = computed(
  () =>
    !!(
      current.value?.gcCode ||
      current.value?.coords ||
      current.value?.difficulty != null ||
      current.value?.terrain != null ||
      current.value?.checkerUrl ||
      current.value?.hint ||
      current.value?.spoiler
    ),
);

const loadError = ref('');
const activeTab = ref<'notes' | 'attempts'>('notes');
const statusBusy = ref(false);
const claimBusy = ref(false);

const editing = ref(false);
const editSaving = ref(false);
const editError = ref('');
const editForm = ref({
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

const STATUS_I18N: Record<string, string> = {
  open: 'puzzle.status.open',
  in_progress: 'puzzle.status.in_progress',
  solved: 'puzzle.status.solved',
  verified: 'puzzle.status.verified',
};

const nextStatus = computed(() =>
  current.value ? (STATUS_NEXT[current.value.status] ?? null) : null,
);

const nextStatusLabel = computed(() => {
  if (!nextStatus.value) return '';
  const key = STATUS_I18N[nextStatus.value];
  return key ? t(key) : nextStatus.value;
});

const isClaimed = computed(() => current.value?.workingOnId === currentUserId);

onMounted(async () => {
  try {
    await Promise.all([
      puzzleStore.fetchById(collectionId, puzzleId),
      noteStore.fetchAll(puzzleId),
      attemptStore.fetchAll(puzzleId),
      collectionStore.fetchById(collectionId),
    ]);
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Failed to load puzzle.';
  }
});

/** Populates the edit form from the current puzzle and switches to edit mode. */
function startEdit() {
  if (!current.value) return;
  const p = current.value;
  editForm.value = {
    title: p.title,
    description: p.description ?? '',
    checkerUrl: p.checkerUrl ?? '',
    gcCode: p.gcCode ?? '',
    difficulty: p.difficulty ?? null,
    terrain: p.terrain ?? null,
    coords: p.coords ?? '',
    hint: p.hint ?? '',
    spoiler: p.spoiler ?? '',
  };
  editing.value = true;
  editError.value = '';
}

/** Saves the edit form. */
async function handleSaveEdit() {
  editError.value = '';
  editSaving.value = true;
  try {
    const f = editForm.value;
    await puzzleStore.update(collectionId, puzzleId, {
      title: f.title,
      description: f.description || null,
      checkerUrl: f.checkerUrl || null,
      gcCode: f.gcCode || null,
      difficulty: f.difficulty,
      terrain: f.terrain,
      coords: f.coords || null,
      hint: f.hint || null,
      spoiler: f.spoiler || null,
    });
    editing.value = false;
  } catch (e) {
    editError.value = e instanceof Error ? e.message : 'Failed to save puzzle.';
  } finally {
    editSaving.value = false;
  }
}

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
