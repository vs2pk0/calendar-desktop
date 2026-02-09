/*
 * @Author: DaLong Li
 * @Date: 2026-02-05 15:45:33
 * @LastEditTime: 2026-02-09 10:03:35
 * @LastEditors: DaLong Li
 * @Description:
 * 生命在于运动，代码在于抽动。
 */
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
