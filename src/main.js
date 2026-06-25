import { createApp } from 'vue';
import PublicSite from './App.vue';
import LoginPage from './LoginPage.vue';
import AdminPanel from './AdminPanel.vue';

const path = window.location.pathname;
const RootComponent = path.startsWith('/admin')
  ? AdminPanel
  : path.startsWith('/login')
    ? LoginPage
    : PublicSite;

createApp(RootComponent).mount('#app');
