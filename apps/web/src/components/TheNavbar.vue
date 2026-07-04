<template>
  <nav class="border-b bg-background">
    <div
      class="container flex min-h-14 flex-wrap items-center gap-x-6 gap-y-2 py-2"
    >
      <RouterLink to="/collections" class="font-semibold text-primary">
        HiveMind
      </RouterLink>

      <RouterLink
        to="/templates"
        class="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {{ t('nav.templates') }}
      </RouterLink>

      <div class="ml-auto flex items-center gap-2">
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
          <!-- Sun — shown in dark mode to switch to light -->
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
          <!-- Moon — shown in light mode to switch to dark -->
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
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useDarkMode } from '@/composables/useDarkMode';
import { SUPPORTED_LOCALES, type Locale } from '@/i18n';

const { t, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const { isDark, toggle: toggleDark } = useDarkMode();

const currentLocale = computed(() => locale.value);

/** Logs out and redirects to the login page. */
async function handleLogout() {
  await auth.logout();
  router.push('/login');
}

/** Persists language preference and updates the UI locale. */
async function changeLanguage(lang: Locale) {
  await auth.setLanguage(lang);
}
</script>
