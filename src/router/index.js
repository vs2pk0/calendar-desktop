/*
 * @Author: DaLong Li
 * @Date: 2026-02-05 18:44:16
 * @LastEditTime: 2026-02-05 18:46:01
 * @LastEditors: DaLong Li
 * @Description:
 * 生命在于运动，代码在于抽动。
 */
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import SubscriptionView from '../views/SubscriptionView.vue';
import ToolsView from '../views/ToolsView.vue';

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView
    },
    {
        path: '/subscription',
        name: 'subscription',
        component: SubscriptionView
    },
    {
        path: '/tools',
        name: 'tools',
        component: ToolsView
    },
    {
        path: '/settings',
        name: 'settings',
        component: () => import('../views/SettingsView.vue')
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
