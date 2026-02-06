<template>
    <div class="settings-view-page">
        <div class="settings-header">
            <h2 class="title">系统设置</h2>
            <div class="header-ops">
                <a-button type="link" @click="goBack"> <left-outlined /> 返回日历 </a-button>
            </div>
        </div>

        <div class="settings-content">
            <a-tabs v-model:active-key="activeTab" type="card">
                <a-tab-pane key="api" tab="API 配置">
                    <div class="settings-section">
                        <a-form layout="vertical">
                            <a-form-item label="天气预报 API (高德地图)">
                                <template #extra>用于同步首页和右侧边栏的天气信息</template>
                                <a-input v-model:value="settingsForm.weatherApi" placeholder="接口地址" />
                                <a-input
                                    v-model:value="settingsForm.weatherKey"
                                    placeholder="API Key"
                                    style="margin-top: 12px"
                                />
                            </a-form-item>

                            <a-divider />

                            <a-form-item label="星座运势 API (聚合数据)">
                                <template #extra>用于右侧边栏的星座运势卡片</template>
                                <a-input v-model:value="settingsForm.zodiacApi" placeholder="接口地址" />
                                <a-input
                                    v-model:value="settingsForm.zodiacKey"
                                    placeholder="API Key"
                                    style="margin-top: 12px"
                                />
                            </a-form-item>

                            <a-divider />

                            <a-form-item label="节假日 API (timor.tech)">
                                <template #extra>用于日历下标显示节假日和调休信息</template>
                                <a-input v-model:value="settingsForm.holidayApi" placeholder="年接口地址" />
                            </a-form-item>

                            <div class="form-actions">
                                <a-button type="primary" size="large" @click="saveSettings">保存配置</a-button>
                                <a-button style="margin-left: 12px" @click="resetSettings">重置为默认</a-button>
                            </div>
                        </a-form>
                    </div>
                </a-tab-pane>

                <a-tab-pane key="data" tab="数据管理">
                    <div class="settings-section data-section">
                        <div class="data-card danger">
                            <div class="card-info">
                                <div class="card-title">清除日程数据库</div>
                                <div class="card-desc">
                                    这将永久删除 SQLite 数据库中保存的所有日程、待办、生日等事项。此操作不可撤销。
                                </div>
                            </div>
                            <a-button danger @click="clearDatabase">清除所有数据</a-button>
                        </div>

                        <a-divider />

                        <div class="data-card">
                            <div class="card-info">
                                <div class="card-title">清除本地缓存 (Local Storage)</div>
                                <div class="card-desc">
                                    重置所有订阅状态、主题设置、搜索历史及 API 配置。执行后应用将自动刷新。
                                </div>
                            </div>
                            <a-button danger ghost @click="clearCache">重置应用</a-button>
                        </div>
                    </div>
                </a-tab-pane>

                <a-tab-pane key="about" tab="关于">
                    <div class="settings-section about-section">
                        <div class="app-logo">
                            <calendar-filled style="font-size: 64px; color: #5b7cfa" />
                        </div>
                        <h2 class="app-name">智能日历桌面版</h2>
                        <div class="app-version">Version 1.0.0</div>
                        <div class="app-desc">
                            一个基于 Tauri + Vue 3 的轻量级桌面日历应用，支持农历、节假日、日程提醒及多种生活订阅服务。
                        </div>
                    </div>
                </a-tab-pane>
            </a-tabs>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, createVNode } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { LeftOutlined, ExclamationCircleOutlined, CalendarFilled } from '@ant-design/icons-vue';
import settingsManager from '../utils/settingsManager';
import scheduleManager from '../utils/scheduleManager';

const router = useRouter();
const activeTab = ref('api');

const settingsForm = ref({
    weatherApi: '',
    weatherKey: '',
    zodiacApi: '',
    zodiacKey: '',
    holidayApi: ''
});

function loadSettings() {
    settingsForm.value = settingsManager.getAll();
}

function saveSettings() {
    settingsManager.setAll(settingsForm.value);
    message.success('配置已保存');
}

function resetSettings() {
    Modal.confirm({
        title: '确定要重置配置吗？',
        content: '这将把所有 API 地址和 Key 还原为默认值。',
        onOk() {
            settingsManager.reset();
            loadSettings();
            message.success('已恢复默认配置');
        }
    });
}

function goBack() {
    router.push('/');
}

function clearDatabase() {
    Modal.confirm({
        title: '确定要清除所有日程吗？',
        icon: createVNode(ExclamationCircleOutlined, { style: 'color: #ff4d4f' }),
        content: '此操作将从本地数据库中永久删除所有日程记录。',
        okText: '确定清除',
        okType: 'danger',
        onOk: async () => {
            try {
                await scheduleManager.clearAll();
                message.success('数据库已清空');
            } catch (e) {
                message.error('清除失败');
            }
        }
    });
}

function clearCache() {
    Modal.confirm({
        title: '确定要重置应用吗？',
        icon: createVNode(ExclamationCircleOutlined, { style: 'color: #ff4d4f' }),
        content: '此操作将清除本地存储的所有配置、订阅和偏好设置。重置后应用将重启。',
        okText: '确定重置',
        okType: 'danger',
        onOk() {
            localStorage.clear();
            window.location.reload();
        }
    });
}

onMounted(() => {
    loadSettings();
});
</script>

<style scoped>
.settings-view-page {
    padding: 24px 32px;
    background: white;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-shrink: 0;
}

.settings-header .title {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
}

.settings-content {
    flex: 1;
    overflow-y: auto;
}

.settings-section {
    padding: 24px 0;
    max-width: 600px;
}

.form-actions {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #f0f0f0;
}

.data-section {
    max-width: 100%;
}

.data-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: #fafafa;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
}

.data-card.danger {
    background: #fff1f0;
    border-color: #ffa39e;
}

.card-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
}

.card-desc {
    font-size: 13px;
    color: #666;
    max-width: 600px;
}

.about-section {
    text-align: center;
    margin: 40px auto;
}

.app-name {
    font-size: 24px;
    margin: 16px 0 8px;
    color: #333;
}

.app-version {
    color: #999;
    margin-bottom: 24px;
}

.app-desc {
    color: #666;
    line-height: 1.6;
    max-width: 400px;
    margin: 0 auto;
}

:deep(.ant-tabs-nav) {
    margin-bottom: 0;
}
</style>
