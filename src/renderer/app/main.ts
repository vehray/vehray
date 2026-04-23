import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'element-plus/dist/index.css';
import '../shared/theme/tokens.css';
import App from './App.vue';
import { i18n } from '../shared/i18n';
import { uiActions } from '../services/uiActions';

const app = createApp(App);

app.use(ElementPlus);
app.use(i18n);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

void uiActions.initPreferences().finally(() => {
  app.mount('#app');
});
