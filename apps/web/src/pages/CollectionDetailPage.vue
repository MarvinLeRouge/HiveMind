<template>
  <div class="container py-8">
    <p v-if="loadError" role="alert" class="text-sm text-destructive">
      {{ loadError }}
    </p>

    <p v-else-if="loading" class="text-sm text-muted-foreground">
      {{ t('common.loading') }}
    </p>

    <template v-else-if="current">
      <!-- Outer layout: main content + members panel -->
      <div class="flex items-start gap-6">
        <!-- ── Main content ──────────────────────────────────────────────── -->
        <div class="min-w-0 flex-1">
          <!-- Header -->
          <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <RouterLink
                to="/collections"
                class="text-sm text-muted-foreground hover:text-foreground"
              >
                {{ t('collection.back') }}
              </RouterLink>
              <h1 class="mt-1 text-2xl font-bold">{{ current.name }}</h1>
              <p
                v-if="current.description"
                class="mt-1 text-sm text-muted-foreground"
              >
                {{ current.description }}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ t('collection.template') }}:
                {{ current.templateSnapshot.name }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <!-- Members toggle — desktop -->
              <button
                class="hidden items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted md:inline-flex"
                :aria-expanded="membersOpen"
                aria-controls="members-panel"
                @click="toggleMembers"
              >
                <!-- people icon -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {{ t('collection.members') }}
                <span
                  class="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium"
                >
                  {{ members.length }}
                </span>
              </button>

              <!-- Members toggle — mobile -->
              <button
                class="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted md:hidden"
                @click="drawerOpen = true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {{ t('collection.members') }}
              </button>

              <RouterLink
                v-if="isOwner"
                :to="`/collections/${current.slug}/settings`"
                class="text-sm text-muted-foreground hover:text-foreground"
              >
                {{ t('collection.settings') }}
              </RouterLink>
            </div>
          </div>

          <!-- Puzzles section header -->
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold">{{ t('collection.puzzles') }}</h2>
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

              <div
                v-if="template.difficultyMode !== 'disabled'"
                class="space-y-1"
              >
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
          <div
            v-if="puzzles.length === 0"
            class="text-sm text-muted-foreground"
          >
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
              <span
                v-if="isOwner"
                aria-hidden="true"
                class="cursor-grab select-none text-muted-foreground"
                title="Drag to reorder"
              >
                ⠿
              </span>
              <PuzzleStatusBadge :status="puzzle.status" />
              <RouterLink
                :to="`/collections/${collectionId}/puzzles/${puzzle.id}`"
                class="flex-1 font-medium hover:underline"
              >
                {{ puzzle.title }}
              </RouterLink>
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
              <span v-if="puzzle.gcCode" class="text-xs text-muted-foreground">
                {{ puzzle.gcCode }}
              </span>
            </li>
          </ul>
        </div>

        <!-- ── Desktop members panel ────────────────────────────────────── -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-x-4"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 translate-x-4"
        >
          <aside
            v-if="membersOpen"
            id="members-panel"
            class="hidden w-72 shrink-0 md:block"
          >
            <MembersPanel
              :members="members"
              :is-owner="isOwner"
              :auth-user-id="authUser?.id"
              :inviting="inviting"
              :invite-success="inviteSuccess"
              :invite-error="inviteError"
              @remove="handleRemoveMember"
              @invite="handleInvite"
            />
          </aside>
        </Transition>
      </div>

      <!-- ── Mobile drawer ──────────────────────────────────────────────── -->
      <Teleport to="body">
        <Transition
          enter-active-class="transition-all duration-250 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="drawerOpen"
            class="fixed inset-0 z-50 md:hidden"
            role="dialog"
            aria-modal="true"
            :aria-label="t('collection.members')"
          >
            <!-- Backdrop -->
            <div
              class="absolute inset-0 bg-black/40"
              @click="drawerOpen = false"
            />
            <!-- Drawer -->
            <aside
              class="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-xl bg-background p-6 shadow-xl"
            >
              <div class="mb-4 flex items-center justify-between">
                <h2 class="font-semibold">{{ t('collection.members') }}</h2>
                <button
                  class="rounded p-1 hover:bg-muted"
                  aria-label="Close"
                  @click="drawerOpen = false"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-4 w-4"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <MembersPanel
                :members="members"
                :is-owner="isOwner"
                :auth-user-id="authUser?.id"
                :inviting="inviting"
                :invite-success="inviteSuccess"
                :invite-error="inviteError"
                @remove="handleRemoveMember"
                @invite="handleInvite"
              />
            </aside>
          </div>
        </Transition>
      </Teleport>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useCollectionStore } from '@/stores/collection';
import { usePuzzleStore } from '@/stores/puzzle';
import { useAuthStore } from '@/stores/auth';
import PuzzleStatusBadge from '@/components/PuzzleStatusBadge.vue';
import MembersPanel from '@/components/MembersPanel.vue';

const { t } = useI18n();
const route = useRoute();
const collectionId = route.params.id as string;

const collectionStore = useCollectionStore();
const puzzleStore = usePuzzleStore();
const auth = useAuthStore();

const { current, members, isOwner } = storeToRefs(collectionStore);
const { puzzles } = storeToRefs(puzzleStore);
const authUser = auth.user;
const currentUserId = authUser?.id;

const template = computed(() => current.value?.templateSnapshot ?? null);

// ── State ─────────────────────────────────────────────────────────────────────

const loading = ref(true);
const loadError = ref('');

// Puzzle add form
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

// Members panel — desktop (persisted per user in localStorage)
const storageKey = `hm:members-panel:${authUser?.id ?? 'guest'}`;
const membersOpen = ref(false);

// Members drawer — mobile (no persistence needed)
const drawerOpen = ref(false);

// Invite form
const inviteEmail = ref('');
const inviting = ref(false);
const inviteSuccess = ref(false);
const inviteError = ref('');

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  const stored = localStorage.getItem(storageKey);
  if (stored !== null) membersOpen.value = stored === 'true';

  try {
    await Promise.all([
      collectionStore.fetchById(collectionId),
      puzzleStore.fetchAll(collectionId),
    ]);
  } catch (e) {
    loadError.value =
      e instanceof Error ? e.message : 'Failed to load collection.';
  } finally {
    loading.value = false;
  }
});

watch(membersOpen, (val) => {
  localStorage.setItem(storageKey, String(val));
});

// ── Members panel ─────────────────────────────────────────────────────────────

/** Toggles the desktop members panel and persists the preference. */
function toggleMembers() {
  membersOpen.value = !membersOpen.value;
}

// ── Members handlers ──────────────────────────────────────────────────────────

/** Removes a member from the collection. */
async function handleRemoveMember(userId: string) {
  try {
    await collectionStore.removeMember(collectionId, userId);
  } catch (e) {
    loadError.value =
      e instanceof Error ? e.message : 'Failed to remove member.';
  }
}

/** Sends an invitation to the provided email address. */
async function handleInvite(email: string) {
  inviteSuccess.value = false;
  inviteError.value = '';
  inviting.value = true;
  try {
    await collectionStore.invite(collectionId, email);
    inviteSuccess.value = true;
    inviteEmail.value = '';
  } catch (e) {
    inviteError.value =
      e instanceof Error ? e.message : 'Failed to send invitation.';
  } finally {
    inviting.value = false;
  }
}

// ── Puzzle handlers ───────────────────────────────────────────────────────────

let draggedIndex: number | null = null;

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
