import { createApp } from 'vue';
import App from './App.vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import './style.css';

// Import dayjs locale
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');

// Import Ant Design locale
import zhCN from 'ant-design-vue/es/locale/zh_CN';

import router from './router';

const app = createApp(App);
app.use(Antd);
app.use(router);

// 配置全局中文
app.provide('locale', zhCN);

app.mount('#app');
