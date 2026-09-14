import { createApp } from "vue";
import { createPinia } from "pinia";

import App from './App.vue'
import router from './router'
import './style/main.css'
import'@/style/total.css'
import './style/workflow-tokens.css'


import "@/style/index.css";

const app = createApp(App)



app.use(createPinia());
app.use(router);

app.mount("#app");
