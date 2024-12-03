import { createApp } from 'vue';
import App from './App.vue';
import router from "@/router/index.js";
import { setupFontAwesome } from './plugins/fontawesome'

const app = createApp(App);

app.use(router);

setupFontAwesome(app);

app.mount('#app');
