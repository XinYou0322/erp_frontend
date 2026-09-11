import { createApp } from "vue";
import { createPinia } from "pinia";

import App from './App.vue'
import router from './router'
import './testXinyou/main.css'
import'@/style/total.css'

const app = createApp(App)

import "./testErp-sheng/index.css";


app.use(createPinia());
app.use(router);

app.mount("#app");
