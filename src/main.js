import {createApp} from 'vue';
import {createPinia} from "pinia";
import App from './App.vue';
import router from "@/router/index.js";
import {setupFontAwesome} from './plugins/fontawesome'
import BootstrapVue3 from 'bootstrap-vue-3'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'

const app = createApp(App);
const pinia= createPinia();

app.use(router);
app.use(pinia);
app.use(BootstrapVue3);

setupFontAwesome(app);

app.mount('#app');
