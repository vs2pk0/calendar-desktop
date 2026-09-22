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
                <a-tab-pane key="general" tab="常规设置">
                    <div class="settings-section">
                        <a-form layout="vertical">
                            <a-form-item label="开机自启动">
                                <template #extra>登录系统后自动启动云小历（macOS 通过登录项 LaunchAgent 实现）</template>
                                <div class="setting-item-row">
                                    <span>登录后自动启动</span>
                                    <a-switch
                                        v-model:checked="autoLaunch"
                                        :loading="autoLaunchLoading"
                                        @change="handleAutoLaunchToggle"
                                    />
                                </div>
                            </a-form-item>

                            <a-form-item label="系统状态栏显示">
                                <template #extra>在 macOS 顶部状态栏实时显示当前日期、时间和天气</template>
                                <div class="setting-item-row">
                                    <span>显示时间与天气</span>
                                    <a-switch v-model:checked="settingsForm.showTrayTime" @change="handleTrayToggle" />
                                </div>
                                <a-alert
                                    v-if="trayIssue"
                                    type="warning"
                                    show-icon
                                    style="margin-top: 12px"
                                    :message="trayIssue.title"
                                >
                                    <template #description>
                                        <div>{{ trayIssue.desc }}</div>
                                        <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap">
                                            <a-button
                                                v-if="trayIssue.repairable"
                                                type="primary"
                                                size="small"
                                                :loading="trayRepairing"
                                                @click="handleTrayRepair"
                                            >
                                                一键修复
                                            </a-button>
                                            <a-button size="small" @click="openMenuBarSettings">打开系统设置</a-button>
                                            <a-button size="small" @click="checkTrayRegistration">重新检测</a-button>
                                        </div>
                                    </template>
                                </a-alert>
                            </a-form-item>

                            <a-form-item label="显示格式">
                                <template #extra>
                                    支持自定义格式。占位符：{city} 城市, {temp} 温度, {weather} 天气。 时间格式参考
                                    dayjs (如: HH:mm:ss)。
                                </template>
                                <a-select
                                    v-model:value="settingsForm.trayDisplayFormat"
                                    @change="handleFormatChange"
                                    placeholder="选择显示格式"
                                    style="width: 100%"
                                >
                                    <a-select-option value="M月D日 ddd HH:mm:ss - {city} {temp}°C {weather}">
                                        日期+时间+天气 (最丰富)
                                    </a-select-option>
                                    <a-select-option value="M月D日 ddd HH:mm:ss"> 日期+星期+时间 </a-select-option>
                                    <a-select-option value="HH:mm:ss"> 仅时间 (分秒) </a-select-option>
                                    <a-select-option value="{city} {temp}°C {weather}"> 仅天气信息 </a-select-option>
                                </a-select>
                                <a-input
                                    v-model:value="settingsForm.trayDisplayFormat"
                                    placeholder="或输入自定义格式内容"
                                    style="margin-top: 12px"
                                    @change="handleFormatInputChange"
                                />
                            </a-form-item>
                        </a-form>
                    </div>
                </a-tab-pane>
                <a-tab-pane key="api" tab="API 配置">
                    <div class="settings-section">
                        <a-form layout="vertical">
                            <a-form-item label="天气数据源">
                                <template #extra>
                                    免费天气接口（来源：rinuo.com/free/weather），可随时切换；
                                    带 🔑 的源需要自行注册并填写 API Key。
                                </template>
                                <a-select
                                    v-model:value="settingsForm.weatherProvider"
                                    @change="handleWeatherProviderChange"
                                    style="width: 100%"
                                >
                                    <a-select-option v-for="p in weatherProviders" :key="p.id" :value="p.id">
                                        {{ p.needKey ? '🔑 ' : '' }}{{ p.name }}
                                    </a-select-option>
                                </a-select>
                                <template v-if="currentProviderNeedKey">
                                    <a-input
                                        v-model:value="settingsForm.weatherKeys[settingsForm.weatherProvider]"
                                        placeholder="请输入该数据源的 API Key"
                                        style="margin-top: 12px"
                                        @change="handleWeatherKeyChange"
                                    />
                                    <div style="margin-top: 6px; font-size: 12px">
                                    <a :href="currentProviderDoc" target="_blank">前往 {{ currentProviderName }} 注册获取 Key →</a>
                                    </div>
                                </template>
                            </a-form-item>

                            <a-divider />

                            <a-form-item label="星座运势 API">
                                <template #extra>
                                    用于右侧边栏的星座运势卡片。
                                    <a href="https://xxapi.cn/doc/horoscope" target="_blank">查看 xxapi.cn 文档</a>
                                </template>
                                <a-input v-model:value="settingsForm.zodiacApi" placeholder="接口地址" />
                                <a-input
                                    v-model:value="settingsForm.zodiacKey"
                                    placeholder="API Key"
                                    style="margin-top: 12px"
                                />
                            </a-form-item>

                            <a-divider />

                            <a-form-item label="节假日 API (timor.tech)">
                                <template #extra>
                                    用于日历下标显示节假日和调休信息。
                                    <a href="https://timor.tech/api/holiday/" target="_blank">查看节假日文档</a>
                                </template>
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
                            <img
                                src="/logo.png"
                                alt="logo"
                                style="width: 80px; height: 80px; object-fit: contain; border-radius: 16px"
                            />
                        </div>
                        <h2 class="app-name">云小历</h2>
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
import { ref, onMounted, createVNode, computed } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { LeftOutlined, ExclamationCircleOutlined, CalendarFilled } from '@ant-design/icons-vue';
import settingsManager from '../utils/settingsManager';
import scheduleManager from '../utils/scheduleManager';
import { enable as enableAutostart, disable as disableAutostart, isEnabled as isAutostartEnabled } from '@tauri-apps/plugin-autostart';
import { invoke } from '@tauri-apps/api/core';
import { WEATHER_PROVIDERS } from '../utils/weatherManager';

const router = useRouter();
const activeTab = ref('api');

// 天气数据源切换
const weatherProviders = WEATHER_PROVIDERS;
const currentProvider = computed(
    () => weatherProviders.find((p) => p.id === settingsForm.value.weatherProvider) || weatherProviders[0]
);
const currentProviderNeedKey = computed(() => currentProvider.value.needKey);
const currentProviderDoc = computed(() => currentProvider.value.doc);
const currentProviderName = computed(() => currentProvider.value.name);

function handleWeatherProviderChange(value) {
    settingsManager.set('weatherProvider', value);
    const p = weatherProviders.find((x) => x.id === value);
    message.success(`天气数据源已切换为 ${p ? p.name : value}`);
}

function handleWeatherKeyChange() {
    settingsManager.set('weatherKeys', { ...settingsForm.value.weatherKeys });
    message.success('天气 API Key 已保存');
}

// 开机自启动（状态直接读取系统，不存 localStorage）
const autoLaunch = ref(false);
const autoLaunchLoading = ref(false);

async function loadAutoLaunchState() {
    try {
        autoLaunch.value = await isAutostartEnabled();
    } catch (e) {
        console.error('读取自启动状态失败:', e);
    }
}

async function handleAutoLaunchToggle(checked) {
    autoLaunchLoading.value = true;
    try {
        if (checked) {
            await enableAutostart();
        } else {
            await disableAutostart();
        }
        message.success(checked ? '已开启开机自启动' : '已关闭开机自启动');
    } catch (e) {
        console.error('设置自启动失败:', e);
        autoLaunch.value = !checked; // 失败回滚
        message.error('设置失败，请重试');
    } finally {
        autoLaunchLoading.value = false;
    }
}

const settingsForm = ref({
    weatherProvider: 'open-meteo',
    weatherKeys: { openweathermap: '', weatherapi: '', weatherbit: '' },
    zodiacApi: '',
    zodiacKey: '',
    holidayApi: '',
    showTrayTime: true,
    trayDisplayFormat: ''
});

function loadSettings() {
    settingsForm.value = settingsManager.getAll();
}

function saveSettings() {
    settingsManager.setAll(settingsForm.value);
    message.success('配置已保存');
}

function handleTrayToggle(checked) {
    settingsManager.set('showTrayTime', checked);
    message.success(checked ? '状态栏显示已开启' : '状态栏显示已关闭');
    if (checked) {
        // ControlCenter 需要一点时间完成登记判定
        setTimeout(checkTrayRegistration, 1500);
    } else {
        trayIssue.value = null;
    }
}

// macOS 26（Tahoe）状态栏归属诊断：
// 状态栏项由 ControlCenter 统一托管，若本应用在"系统设置 → 菜单栏"中被关闭，
// 或被归属到了另一个已关闭的应用（从终端/IDE 直接启动应用时会发生），状态栏项会创建成功但永远不显示。
const isMacOS = /Mac OS X|Macintosh/.test(navigator.userAgent);
const trayIssue = ref(null);
const trayRepairing = ref(false);

async function checkTrayRegistration() {
    trayIssue.value = null;
    if (!isMacOS || !settingsForm.value.showTrayTime) return;
    try {
        const reg = await invoke('tray_registration_status');
        if (!reg || !reg.available) return;
        if (reg.blocked_by && reg.blocked_by.length > 0) {
            trayIssue.value = {
                title: 'macOS 未显示云小历的状态栏项',
                desc:
                    `macOS 把云小历的状态栏项归属到了「${reg.blocked_by.join('、')}」，而该应用已被禁止在菜单栏显示，` +
                    '云小历因此被一并屏蔽（通常是从终端或开发工具直接启动云小历导致）。点击"一键修复"解除关联并重启控制中心；' +
                    '之后请通过 Finder / 启动台 / Dock 打开云小历。',
                repairable: true
            };
        } else if (reg.allowed === false) {
            trayIssue.value = {
                title: 'macOS 未允许云小历在菜单栏显示',
                desc: '请在 系统设置 → 菜单栏 → "允许在菜单栏中显示" 中开启云小历，或点击"一键修复"。',
                repairable: true
            };
        }
    } catch (e) {
        console.error('检测状态栏登记失败:', e);
    }
}

async function handleTrayRepair() {
    trayRepairing.value = true;
    try {
        const result = await invoke('repair_tray_registration');
        message.success(result);
        setTimeout(checkTrayRegistration, 2000);
    } catch (e) {
        message.error(`修复失败：${e}`);
    } finally {
        trayRepairing.value = false;
    }
}

async function openMenuBarSettings() {
    try {
        await invoke('open_menu_bar_settings');
    } catch (e) {
        message.error(`打开系统设置失败：${e}`);
    }
}

function handleFormatChange(value) {
    settingsManager.set('trayDisplayFormat', value);
    message.success('显示格式已更新');
}

function handleFormatInputChange(e) {
    settingsManager.set('trayDisplayFormat', e.target.value);
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
    loadAutoLaunchState();
    checkTrayRegistration();
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

.setting-item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f9f9f9;
    border-radius: 8px;
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
