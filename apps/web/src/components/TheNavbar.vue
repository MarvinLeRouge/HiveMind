<template>
  <nav class="border-b bg-background">
    <!-- Main bar -->
    <div class="container flex min-h-14 items-center justify-between py-2">
      <div class="flex items-center gap-6">
        <RouterLink to="/collections" class="font-semibold text-primary">
          HiveMind
        </RouterLink>

        <!-- Templates link — desktop only -->
        <RouterLink
          to="/templates"
          class="hidden rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:block"
        >
          {{ t('nav.templates') }}
        </RouterLink>
      </div>

      <!-- Desktop right side -->
      <div class="hidden items-center gap-2 md:flex">
        <span class="text-sm text-muted-foreground">{{
          auth.user?.username
        }}</span>

        <!-- Language toggle -->
        <div class="flex items-center gap-0.5 text-sm">
          <button
            v-for="lang in SUPPORTED_LOCALES"
            :key="lang"
            :class="[
              'rounded-full px-2.5 py-0.5 transition-colors',
              currentLocale === lang
                ? 'bg-primary/15 font-semibold text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            ]"
            :aria-pressed="currentLocale === lang"
            @click="changeLanguage(lang)"
          >
            {{ t(`lang.${lang}`) }}
          </button>
        </div>

        <!-- Dark / light toggle -->
        <button
          class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          :aria-label="isDark ? t('nav.lightMode') : t('nav.darkMode')"
          @click="toggleDark"
        >
          <svg
            v-if="isDark"
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
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
            />
          </svg>
          <svg
            v-else
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
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>

        <button
          class="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          @click="handleLogout"
        >
          {{ t('nav.logout') }}
        </button>
      </div>

      <!-- Mobile hamburger -->
      <button
        class="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        :aria-expanded="mobileMenuOpen"
        :aria-label="mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <!-- Close icon -->
        <svg
          v-if="mobileMenuOpen"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        <!-- Hamburger icon -->
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Mobile menu panel -->
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="mobileMenuOpen" class="border-t md:hidden">
        <div class="container py-3">
          <!-- Templates link -->
          <RouterLink
            to="/templates"
            class="flex items-center rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            @click="mobileMenuOpen = false"
          >
            {{ t('nav.templates') }}
          </RouterLink>

          <div class="my-2 border-t" />

          <!-- Bottom row: user + controls -->
          <div class="flex items-center justify-between px-3 py-2">
            <span class="text-sm text-muted-foreground">{{
              auth.user?.username
            }}</span>

            <div class="flex items-center gap-1">
              <!-- Language toggle -->
              <div class="flex items-center gap-0.5 text-sm">
                <button
                  v-for="lang in SUPPORTED_LOCALES"
                  :key="lang"
                  :class="[
                    'rounded-full px-2.5 py-0.5 transition-colors',
                    currentLocale === lang
                      ? 'bg-primary/15 font-semibold text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  ]"
                  :aria-pressed="currentLocale === lang"
                  @click="changeLanguage(lang)"
                >
                  {{ t(`lang.${lang}`) }}
                </button>
              </div>

              <!-- Dark / light toggle -->
              <button
                class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                :aria-label="isDark ? t('nav.lightMode') : t('nav.darkMode')"
                @click="toggleDark"
              >
                <svg
                  v-if="isDark"
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
                  <circle cx="12" cy="12" r="4" />
                  <path
                    d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                  />
                </svg>
                <svg
                  v-else
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
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>

              <!-- Logout -->
              <button
                class="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                @click="handleLogout"
              >
                {{ t('nav.logout') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useDarkMode } from '@/composables/useDarkMode';
import { SUPPORTED_LOCALES, type Locale } from '@/i18n';

const { t, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const { isDark, toggle: toggleDark } = useDarkMode();

const currentLocale = computed(() => locale.value);
const mobileMenuOpen = ref(false);

watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false;
  },
);

/** Logs out and redirects to the login page. */
async function handleLogout() {
  mobileMenuOpen.value = false;
  await auth.logout();
  router.push('/login');
}

/** Persists language preference and updates the UI locale. */
async function changeLanguage(lang: Locale) {
  await auth.setLanguage(lang);
}
</script>
