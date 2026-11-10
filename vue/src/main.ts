import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './index.css';
import 'vue-sonner/style.css';

const app = createApp(App).use(router);
router.isReady().then(() => app.mount('#app'));
