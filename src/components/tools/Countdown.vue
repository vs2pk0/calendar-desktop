<template>
    <div class="countdown">
        <a-space direction="vertical" style="width: 100%" :size="16">
            <div>
                <div style="margin-bottom: 8px; font-weight: 500">目标日期：</div>
                <a-date-picker v-model:value="countdownTargetDate" style="width: 100%" />
            </div>
            <div>
                <div style="margin-bottom: 8px; font-weight: 500">事件名称：</div>
                <a-input v-model:value="countdownEventName" placeholder="例如：我的生日" />
            </div>
            <a-divider />
            <div v-if="countdownTargetDate">
                <div style="margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #1890ff">倒计时</div>
                <div class="converter-result">
                    <div style="text-align: center; padding: 20px 0">
                        <div style="font-size: 14px; color: #666; margin-bottom: 8px">
                            {{ countdownEventName || '目标日期' }}
                        </div>
                        <div style="font-size: 48px; font-weight: 700; color: #1890ff; margin-bottom: 8px">
                            {{ getCountdownDays(countdownTargetDate) }}
                        </div>
                        <div style="font-size: 16px; color: #666">
                            {{ getCountdownDays(countdownTargetDate) >= 0 ? '天后到达' : '天前已过' }}
                        </div>
                    </div>
                </div>
            </div>
        </a-space>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import dayjs from 'dayjs';

const countdownTargetDate = ref(dayjs().add(100, 'day'));
const countdownEventName = ref('');

function getCountdownDays(targetDate) {
    const today = dayjs();
    const target = dayjs(targetDate);
    return target.diff(today, 'day');
}
</script>

<style scoped>
.converter-result {
    background: #f5f7fa;
    padding: 16px;
    border-radius: 8px;
}
</style>
