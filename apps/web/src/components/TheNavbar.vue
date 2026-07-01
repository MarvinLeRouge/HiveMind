<template>
  <nav class="border-b bg-background">
    <div
      class="container flex min-h-14 flex-wrap items-center gap-x-6 gap-y-2 py-2"
    >
      <RouterLink to="/collections" class="font-semibold text-foreground">
        HiveMind
      </RouterLink>

      <RouterLink
        to="/templates"
        class="text-sm text-muted-foreground hover:text-foreground"
      >
        {{ t('nav.templates') }}
      </RouterLink>

      <div class="ml-auto flex items-center gap-4">
        <span class="text-sm text-muted-foreground">{{
          auth.user?.username
        }}</span>

        <!-- Language toggle -->
        <div class="flex items-center gap-0.5 text-sm">
          <button
            v-for="lang in SUPPORTED_LOCALES"
            :key="lang"
            :class="[
              'px-1.5 py-0.5 rounded transition-colors',
              currentLocale === lang
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ]"
            :aria-pressed="currentLocale === lang"
            @click="changeLanguage(lang)"
          >
            {{ t(`lang.${lang}`) }}
          </button>
        </div>

        <button
          class="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
import { SUPPORTED_LOCALES, type Locale } from '@/i18n';

const { t, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();

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
