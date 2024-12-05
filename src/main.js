import { createApp } from 'vue';
import { createPinia } from "pinia";
import App from './App.vue';
import router from "@/router/index.js";
import { setupFontAwesome } from './plugins/fontawesome'

const app = createApp(App);
const pinia= createPinia();

app.use(router);
app.use(pinia);

setupFontAwesome(app);

app.mount('#app');
