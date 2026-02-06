<template>
    <div class="subscription-view">
        <div class="subscription-header">
            <h2 class="title">全部订阅</h2>
            <div class="header-ops">
                <a-button type="link" @click="goBack"> <left-outlined /> 返回日历 </a-button>
            </div>
        </div>

        <div class="subscription-grid">
            <div v-for="item in subscriptionItems" :key="item.id" class="sub-card">
                <div class="sub-icon-wrapper" :style="{ background: item.color }">
                    <component :is="iconComponents[item.icon]" style="font-size: 28px; color: white" />
                </div>
                <div class="sub-info">
                    <div class="sub-name">{{ item.name }}</div>
                    <div class="sub-desc">{{ item.desc }}</div>
                </div>
                <div class="sub-action">
                    <a-button
                        :type="item.isSubscribed ? 'default' : 'primary'"
                        shape="round"
                        class="sub-btn"
                        :class="{ 'is-subscribed': item.isSubscribed }"
                        @click="toggleSub(item.id)"
                    >
                        {{ item.isSubscribed ? '已订阅' : '订阅' }}
                    </a-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
    CloudOutlined,
    ExperimentOutlined,
    RocketOutlined,
    GlobalOutlined,
    CarOutlined,
    LeftOutlined
} from '@ant-design/icons-vue';
import subscriptionManager from '../utils/subscriptionManager';

const router = useRouter();
const subscriptionItems = ref([]);

// 映射图标组件
const iconComponents = {
    'cloud-outlined': CloudOutlined,
    'experiment-outlined': ExperimentOutlined,
    'rocket-outlined': RocketOutlined,
    'global-outlined': GlobalOutlined,
    'car-outlined': CarOutlined
};

function loadItems() {
    subscriptionItems.value = subscriptionManager.getAllItems();
}

function toggleSub(id) {
    subscriptionManager.toggleSubscription(id);
    loadItems();
}

function goBack() {
    router.push('/');
}

onMounted(() => {
    loadItems();
});
</script>

<style scoped>
.subscription-view {
    padding: 24px 32px;
    background: white;
    height: 100%;
}

.subscription-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
}

.subscription-header .title {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
}

.subscription-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
}

.sub-card {
    display: flex;
    align-items: center;
    padding: 20px;
    background: #fff;
    border-radius: 16px;
    border: 1px solid #f0f0f0;
    transition: all 0.3s;
}

.sub-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-color: #e0e0e0;
}

.sub-icon-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    flex-shrink: 0;
}

.sub-info {
    flex-grow: 1;
    overflow: hidden;
}

.sub-name {
    font-size: 17px;
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
}

.sub-desc {
    font-size: 13px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sub-btn {
    min-width: 84px;
    height: 36px;
    font-size: 14px;
}

.sub-btn.is-subscribed {
    color: #597ef7;
    border-color: #597ef7;
}
</style>
