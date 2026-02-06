import { ref } from 'vue';

const STORAGE_KEY = 'calendar_subscriptions';

// 所有可用的订阅项
export const AVAILABLE_SUBSCRIPTIONS = [
    {
        id: 'weather',
        name: '天气预报',
        desc: '预报天气和空气质量',
        icon: 'cloud-outlined',
        color: '#1890ff',
        bg: '#e6f7ff'
    },
    {
        id: 'lunar',
        name: '农历详情',
        desc: '农历年、月、日详情',
        icon: 'info-circle-outlined',
        color: '#87d068',
        bg: '#f6ffed'
    },
    {
        id: 'huangli',
        name: '黄历运势',
        desc: '每日宜忌，早知道',
        icon: 'experiment-outlined',
        color: '#fa8c16',
        bg: '#fff7e6'
    },
    {
        id: 'zodiac',
        name: '星座运势',
        desc: '你专属的星座运势...',
        icon: 'rocket-outlined',
        color: '#722ed1',
        bg: '#f9f0ff'
    },
    {
        id: 'worldClock',
        name: '世界时钟',
        desc: '地球上其它城市现...',
        icon: 'global-outlined',
        color: '#13c2c2',
        bg: '#e6fffb'
    },
    {
        id: 'schedule',
        name: '日程安排',
        desc: '管理并提醒您的每日日程',
        icon: 'calendar-outlined',
        color: '#1890ff',
        bg: '#e6f7ff'
    }
];

class SubscriptionManager {
    constructor() {
        this.subscribedIds = ref(this._loadFromStorage());
    }

    _loadFromStorage() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('加载订阅数据失败:', e);
            }
        }
        // 默认订阅
        return ['weather', 'worldClock', 'lunar', 'huangli', 'zodiac'];
    }

    _saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.subscribedIds.value));
    }

    isSubscribed(id) {
        return this.subscribedIds.value.includes(id);
    }

    toggleSubscription(id) {
        const index = this.subscribedIds.value.indexOf(id);
        if (index > -1) {
            this.subscribedIds.value.splice(index, 1);
        } else {
            this.subscribedIds.value.push(id);
        }
        // 确保触发响应式更新
        this.subscribedIds.value = [...this.subscribedIds.value];
        this._saveToStorage();
    }

    getSubscribedItems() {
        return AVAILABLE_SUBSCRIPTIONS.filter((item) => this.subscribedIds.value.includes(item.id));
    }

    getAllItems() {
        return AVAILABLE_SUBSCRIPTIONS.map((item) => ({
            ...item,
            isSubscribed: this.isSubscribed(item.id)
        }));
    }
}

export default new SubscriptionManager();
