import { createApp } from "vue";
import { createPinia } from "pinia";

import App from './App.vue'
import router from './router'
import './style/main.css'
import'@/style/total.css'


const app = createApp(App)

import "./style/index.css";


app.use(createPinia());
app.use(router);

app.mount("#app");
