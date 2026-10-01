import { createApp } from "vue";
import { createPinia } from "pinia";
import { Chart as ChartJS } from "chart.js";

import App from './App.vue'
import router from './router'
import './style/main.css'
import'@/style/total.css'
import './style/workflow-tokens.css'
import "@/style/index.css";

// Chart.js 使用 Canvas 繪製文字，不會套用一般 CSS 字級倍率。
ChartJS.defaults.font.size = 18;

const app = createApp(App)




app.use(createPinia());
app.use(router);

app.mount("#app");
