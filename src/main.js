import { createApp } from 'vue';
import PublicSite from './App.vue';

const path = window.location.pathname;

if (path.startsWith('/login')) {
  window.location.replace('/admin/login');
} else if (path.startsWith('/admin')) {
  await import('../school-management/src/assets/main.css');
  const [{ default: AdminApp }, { default: adminRouter }] = await Promise.all([
    import('../school-management/src/App.vue'),
    import('../school-management/src/router/index.js'),
  ]);

  createApp(AdminApp).use(adminRouter).mount('#app');
} else {
  await Promise.all([
    import('./assets/public.css'),
    import('@fortawesome/fontawesome-free/css/all.min.css'),
  ]);

  createApp(PublicSite).mount('#app');
}
