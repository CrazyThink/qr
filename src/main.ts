import { createApp } from 'vue';
import App from './App.vue';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import ElementPlus from 'element-plus';
import './style.css';

function updateDarkMode() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', isDark);
}

updateDarkMode();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateDarkMode);

const app = createApp(App);
app.use(ElementPlus);

app.mount('#app');
