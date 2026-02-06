<template>
    <a-config-provider :locale="zhCN">
        <div class="app-layout">
            <!-- Header -->
            <header class="app-header" data-tauri-drag-region>
                <div class="header-left">
                    <div class="window-controls">
                        <span class="dot red" @click="closeWindow" title="关闭">
                            <close-outlined class="dot-icon" />
                        </span>
                        <span class="dot yellow" @click="minimizeWindow" title="最小化">
                            <minus-outlined class="dot-icon" />
                        </span>
                        <span class="dot green" @click="toggleMaximize" title="最大化/还原">
                            <border-outlined class="dot-icon" />
                        </span>
                    </div>
                    <div class="logo">
                        <!-- Generic Calendar Icon -->
                        <calendar-filled style="font-size: 24px; color: white" />
                    </div>
                    <div class="nav-tabs">
                        <div class="nav-item" :class="{ active: activeTab === 'calendar' }" @click="goToCalendar">
                            <check-square-outlined style="margin-right: 4px" /> 日历
                        </div>
                        <div
                            class="nav-item"
                            :class="{ active: activeTab === 'subscription' }"
                            @click="goToSubscription"
                        >
                            <star-outlined style="margin-right: 4px" /> 订阅
                        </div>
                        <div class="nav-item" @click="openTools"><tool-outlined style="margin-right: 4px" /> 工具</div>
                    </div>
                </div>
                <div class="header-right">
                    <search-outlined class="header-icon" />
                    <a-popover placement="bottomRight" trigger="click" :overlayStyle="{ paddingTop: '10px' }">
                        <template #content>
                            <div class="notification-popover">
                                <div class="notif-header">
                                    <span>通知中心</span>
                                    <a v-if="notifications.length > 0" @click="clearAllNotifs" style="font-size: 12px"
                                        >清空</a
                                    >
                                </div>
                                <div v-if="notifications.length === 0" class="notif-empty">
                                    <bell-outlined style="font-size: 24px; color: #bfbfbf; margin-bottom: 8px" />
                                    <div>暂无新消息</div>
                                </div>
                                <div v-else class="notif-list">
                                    <div
                                        v-for="notif in notifications"
                                        :key="notif.id"
                                        class="notif-item"
                                        :class="{ unread: !notif.read }"
                                        @click="handleNotifClick(notif)"
                                    >
                                        <div class="notif-title">
                                            <span class="dot" v-if="!notif.read"></span>
                                            {{ notif.title }}
                                            <span class="notif-time">{{ notif.time }}</span>
                                        </div>
                                        <div class="notif-content">{{ notif.content }}</div>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <a-badge :count="unreadCount" :overflow-count="99" :offset="[-2, 2]">
                            <bell-outlined class="header-icon" />
                        </a-badge>
                    </a-popover>
                    <user-outlined class="header-icon user-avatar" />
                </div>
            </header>

            <!-- Content -->
            <main class="app-content">
                <div class="main-view-area">
                    <router-view v-slot="{ Component }">
                        <component :is="Component" ref="viewRef" @select="handleDateSelect" />
                    </router-view>
                </div>
                <div class="side-panel-area">
                    <RightPanel
                        ref="sidePanelRef"
                        :selectedDate="selectedDate"
                        @refresh-calendar="refreshCalendar"
                        @edit-subscription="onEditSubscription"
                    />
                </div>
            </main>

            <!-- 通知详情对话框 -->
            <a-modal v-model:open="notifDetailVisible" title="日程详情" :footer="null" centered>
                <div v-if="selectedNotif" class="notif-detail-view">
                    <div class="detail-header">
                        <span class="detail-type-tag">{{
                            selectedNotif.schedule ? getTypeName(selectedNotif.schedule.type) : '日程'
                        }}</span>
                        <h3 class="detail-title">{{ selectedNotif.fullTitle }}</h3>
                    </div>
                    <div class="detail-body">
                        <div class="detail-row">
                            <clock-circle-outlined />
                            <span class="label">时间：</span>
                            <span class="value"
                                >{{ selectedNotif.schedule?.date }}
                                {{ selectedNotif.schedule?.isAllDay ? '全天' : selectedNotif.schedule?.time }}</span
                            >
                        </div>
                        <div v-if="selectedNotif.location" class="detail-row">
                            <environment-outlined />
                            <span class="label">地点：</span>
                            <span class="value">{{ selectedNotif.location }}</span>
                        </div>
                        <div v-if="selectedNotif.note" class="detail-row note-row">
                            <file-text-outlined />
                            <span class="label">备注：</span>
                            <div class="value note-content">{{ selectedNotif.note }}</div>
                        </div>
                    </div>
                </div>
            </a-modal>
        </div>
    </a-config-provider>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCurrentWindow } from '@tauri-apps/api/window';
import dayjs from 'dayjs';
import scheduleManager from './utils/scheduleManager';
import { message } from 'ant-design-vue';
import {
    CalendarFilled,
    CheckSquareOutlined,
    StarOutlined,
    ToolOutlined,
    SearchOutlined,
    BellOutlined,
    UserOutlined,
    CloseOutlined,
    MinusOutlined,
    BorderOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    FileTextOutlined
} from '@ant-design/icons-vue';
import RightPanel from './components/RightPanel.vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';

const route = useRoute();
const router = useRouter();

// 计算当前激活的标签
const activeTab = computed(() => {
    if (route.path === '/subscription') return 'subscription';
    return 'calendar';
});

const selectedDate = ref(null);
const viewRef = ref(null);
const sidePanelRef = ref(null);

// 通知系统
const notifications = ref([]);
const notifiedIds = new Set();
const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length);
const notifDetailVisible = ref(false);
const selectedNotif = ref(null);

// 导航方法
function goToCalendar() {
    router.push('/');
}

function goToSubscription() {
    router.push('/subscription');
}

function onEditSubscription() {
    router.push('/subscription');
}

// 检查日程提醒
async function checkSchedules() {
    const now = dayjs();
    const dateStr = now.format('YYYY-MM-DD');
    const timeStr = now.format('HH:mm');

    try {
        const todaySchedules = await scheduleManager.getSchedulesByDate(dateStr);
        for (const schedule of todaySchedules) {
            // 生成一个基于日期和ID的唯一提醒标识
            const notifyKey = `${schedule.id}_${dateStr}`;

            // 如果是全天日程，且今天还没提醒过
            if (schedule.isAllDay) {
                if (!notifiedIds.has(notifyKey)) {
                    addNotification(schedule, '今日全天事项', now.format('HH:mm'));
                    notifiedIds.add(notifyKey);
                }
                continue;
            }

            // 如果是普通日程，时间匹配且今天还没提醒过
            if (schedule.time === timeStr && !notifiedIds.has(notifyKey)) {
                addNotification(schedule, '日程开始提醒', timeStr);
                notifiedIds.add(notifyKey);

                // 顶部弹窗轻提示
                message.info({
                    content: `行程提醒: ${schedule.title}`,
                    duration: 5
                });
            }
        }
    } catch (e) {
        console.error('检查日程失败:', e);
    }
}

function addNotification(schedule, title, time) {
    notifications.value.unshift({
        id: Date.now() + Math.random(),
        scheduleId: schedule.id,
        title: title,
        content: `【${schedule.title}】${schedule.isAllDay ? '今天全天' : '现在开始了'}`,
        time: time,
        read: false,
        fullTitle: schedule.title,
        location: schedule.location,
        note: schedule.note,
        schedule: schedule
    });
}

function handleNotifClick(notif) {
    notif.read = true;
    selectedNotif.value = notif;
    notifDetailVisible.value = true;
}

function getTypeName(type) {
    const map = { todo: '待办', event: '日程', birthday: '生日', anniversary: '纪念日', countdown: '倒数' };
    return map[type] || '日程';
}

function clearAllNotifs() {
    notifications.value = [];
    notifiedIds.clear();
}

let checkTimer = null;
onMounted(() => {
    // 立即检查一次
    checkSchedules();
    // 每分钟检查一次 (30s 检查一次防止跳过分钟)
    checkTimer = setInterval(checkSchedules, 30000);
});

onUnmounted(() => {
    if (checkTimer) clearInterval(checkTimer);
});

function handleDateSelect(date) {
    selectedDate.value = date;
}

function refreshCalendar() {
    if (viewRef.value && viewRef.value.refresh) {
        viewRef.value.refresh();
    }
}

function openTools() {
    if (sidePanelRef.value) {
        sidePanelRef.value.showAllTools();
    }
}

// 窗口控制函数
const appWindow = getCurrentWindow();

async function closeWindow() {
    try {
        await appWindow.close();
    } catch (e) {
        console.error('关闭窗口失败:', e);
    }
}

async function minimizeWindow() {
    try {
        await appWindow.minimize();
    } catch (e) {
        console.error('最小化窗口失败:', e);
    }
}

async function toggleMaximize() {
    try {
        const isMaximized = await appWindow.isMaximized();
        if (isMaximized) {
            await appWindow.unmaximize();
        } else {
            await appWindow.maximize();
        }
    } catch (e) {
        console.error('最大化窗口失败:', e);
    }
}
</script>

<style scoped>
.app-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f5f7fa;
}

.app-header {
    height: 50px;
    background-color: #5b7cfa;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    color: white;
    -webkit-app-region: drag;
}

.header-left {
    display: flex;
    align-items: center;
}

.window-controls {
    display: flex;
    gap: 8px;
    margin-right: 24px;
    -webkit-app-region: no-drag;
}
.dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #ccc;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.2s;
}
.dot:hover {
    filter: brightness(1.1);
}
.dot-icon {
    font-size: 8px;
    color: rgba(0, 0, 0, 0.6);
    opacity: 0;
    transition: opacity 0.2s;
}
.dot:hover .dot-icon {
    opacity: 1;
}
.red {
    background-color: #ff5f56;
}
.yellow {
    background-color: #ffbd2e;
}
.green {
    background-color: #27c93f;
}

.logo {
    margin-right: 32px;
    display: flex;
    align-items: center;
    -webkit-app-region: no-drag;
}

.nav-tabs {
    display: flex;
    gap: 24px;
    -webkit-app-region: no-drag;
}
.nav-item {
    cursor: pointer;
    opacity: 0.8;
    font-size: 14px;
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
}
.nav-item:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
}
.nav-item.active {
    opacity: 1;
    font-weight: 500;
    background: rgba(255, 255, 255, 0.2);
}

.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
    -webkit-app-region: no-drag;
}
.header-icon {
    font-size: 18px;
    cursor: pointer;
    opacity: 0.9;
}
.user-avatar {
    background: rgba(255, 255, 255, 0.3);
    padding: 6px;
    border-radius: 50%;
}

/* 通知中心样式 */
.notification-popover {
    width: 300px;
}
.notif-header {
    padding: 8px 4px 12px 4px;
    border-bottom: 1px solid #f0f0f0;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.notif-empty {
    padding: 40px 0;
    text-align: center;
    color: #999;
}
.notif-list {
    max-height: 400px;
    overflow-y: auto;
}
.notif-item {
    padding: 12px 8px;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    transition: background 0.2s;
}
.notif-item:hover {
    background: #f9f9f9;
}
.notif-item.unread {
    background: #fffbe6;
}
.notif-title {
    font-size: 14px;
    color: #333;
    font-weight: 500;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
}
.notif-title .dot {
    width: 6px;
    height: 6px;
    background: #ff4d4f;
    border-radius: 50%;
}
.notif-time {
    margin-left: auto;
    font-size: 12px;
    color: #bfbfbf;
}
.notif-content {
    font-size: 13px;
    color: #666;
    line-height: 1.4;
}

/* 详情弹窗样式 */
.notif-detail-view {
    padding: 10px 0;
}
.detail-header {
    margin-bottom: 20px;
}
.detail-type-tag {
    background: #e6f7ff;
    color: #1890ff;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    margin-bottom: 8px;
    display: inline-block;
}
.detail-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    color: #333;
}
.detail-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.detail-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: #666;
    font-size: 14px;
}
.detail-row .anticon {
    margin-top: 3px;
    color: #8c8c8c;
}
.detail-row .label {
    font-weight: 500;
    min-width: 50px;
}
.detail-row .value {
    color: #333;
    flex: 1;
}
.note-row {
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px dashed #f0f0f0;
}
.note-content {
    background: #f9f9f9;
    padding: 12px;
    border-radius: 8px;
    white-space: pre-wrap;
    font-size: 13px;
    color: #555;
    width: 100%;
}

.app-content {
    flex: 1;
    display: flex;
    padding: 0;
    overflow: hidden;
}

.main-view-area {
    flex: 7;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: transparent;
}

.side-panel-area {
    flex: 3;
    padding: 16px;
    padding-left: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}
</style>
