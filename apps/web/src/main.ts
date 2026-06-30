import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import App from './App.vue';
import router from './router/index';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// Restore session from httpOnly refresh cookie before the router guard fires.
// Without this, Pinia starts with accessToken=null on every page reload and
// the guard always redirects to /login even when the session is still valid.
const auth = useAuthStore();
auth.init().finally(() => {
  app.use(router);
  app.mount('#app');
});
