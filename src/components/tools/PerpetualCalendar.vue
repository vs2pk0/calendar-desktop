<template>
    <div class="perpetual-calendar">
        <a-space direction="vertical" style="width: 100%" :size="16">
            <div>
                <div style="margin-bottom: 8px; font-weight: 500">选择日期：</div>
                <a-date-picker v-model:value="perpetualDate" style="width: 100%" />
            </div>
            <a-divider />
            <div v-if="perpetualDate">
                <div style="margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #1890ff">日期详情</div>
                <div class="converter-result">
                    <div class="result-item">
                        <span class="label">公历：</span>
                        <span class="value"
                            >{{ perpetualDate.format('YYYY年MM月DD日') }} {{ getWeekDay(perpetualDate) }}</span
                        >
                    </div>
                    <div class="result-item">
                        <span class="label">农历：</span>
                        <span class="value">{{ getLunarDate(perpetualDate) }}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">干支：</span>
                        <span class="value">{{ getLunarGanZhi(perpetualDate) }}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">生肖：</span>
                        <span class="value">{{ getLunarZodiac(perpetualDate) }}年</span>
                    </div>
                    <div class="result-item" v-if="getLunarFestival(perpetualDate)">
                        <span class="label">节日：</span>
                        <span class="value" style="color: #ff4d4f">{{ getLunarFestival(perpetualDate) }}</span>
                    </div>
                    <div class="result-item" v-if="getPerpetualTerm(perpetualDate)">
                        <span class="label">节气：</span>
                        <span class="value" style="color: #52c41a">{{ getPerpetualTerm(perpetualDate) }}</span>
                    </div>
                </div>
            </div>
        </a-space>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import dayjs from 'dayjs';
import { Lunar } from 'lunar-javascript';

const perpetualDate = ref(dayjs());

function getWeekDay(date) {
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekDays[date.day()];
}

function getLunarDate(date) {
    const lunar = Lunar.fromDate(date.toDate());
    return `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
}

function getLunarGanZhi(date) {
    const lunar = Lunar.fromDate(date.toDate());
    return `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`;
}

function getLunarZodiac(date) {
    const lunar = Lunar.fromDate(date.toDate());
    return lunar.getYearShengXiao();
}

function getLunarFestival(date) {
    const lunar = Lunar.fromDate(date.toDate());
    const festivals = lunar.getFestivals();
    return festivals.length > 0 ? festivals.join('、') : null;
}

function getPerpetualTerm(date) {
    const lunar = Lunar.fromDate(date.toDate());
    return lunar.getJieQi();
}
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
