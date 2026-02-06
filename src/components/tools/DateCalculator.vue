<template>
    <div class="date-calculator">
        <a-space direction="vertical" style="width: 100%" :size="16">
            <div>
                <div style="margin-bottom: 8px; font-weight: 500">开始日期：</div>
                <a-date-picker v-model:value="calcStartDate" style="width: 100%" />
            </div>
            <div>
                <div style="margin-bottom: 8px; font-weight: 500">结束日期：</div>
                <a-date-picker v-model:value="calcEndDate" style="width: 100%" />
            </div>
            <a-divider />
            <div v-if="calcStartDate && calcEndDate">
                <div style="margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #1890ff">计算结果</div>
                <div class="converter-result">
                    <div class="result-item">
                        <span class="label">相差天数：</span>
                        <span class="value" style="color: #52c41a; font-size: 20px; font-weight: 600">
                            {{ Math.abs(calcEndDate.diff(calcStartDate, 'day')) }} 天
                        </span>
                    </div>
                    <div class="result-item">
                        <span class="label">相差周数：</span>
                        <span class="value"
                            >{{ Math.floor(Math.abs(calcEndDate.diff(calcStartDate, 'day')) / 7) }} 周</span
                        >
                    </div>
                    <div class="result-item">
                        <span class="label">相差月数：</span>
                        <span class="value">{{ Math.abs(calcEndDate.diff(calcStartDate, 'month')) }} 个月</span>
                    </div>
                    <div class="result-item">
                        <span class="label">相差年数：</span>
                        <span class="value">{{ Math.abs(calcEndDate.diff(calcStartDate, 'year')) }} 年</span>
                    </div>
                </div>
            </div>
        </a-space>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import dayjs from 'dayjs';

const calcStartDate = ref(dayjs());
const calcEndDate = ref(dayjs().add(30, 'day'));
</script>

<style scoped>
.converter-result {
    background: #f5f7fa;
    padding: 16px;
    border-radius: 8px;
}
.result-item {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}
.result-item:last-child {
    margin-bottom: 0;
}
.result-item .label {
    min-width: 80px;
    font-weight: 500;
    color: #666;
}
.result-item .value {
    color: #333;
    font-size: 15px;
}
</style>
