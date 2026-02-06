<template>
    <div class="lucky-day">
        <a-space direction="vertical" style="width: 100%" :size="16">
            <div>
                <div style="margin-bottom: 8px; font-weight: 500">选择日期：</div>
                <a-date-picker v-model:value="luckyDate" style="width: 100%" />
            </div>
            <a-divider />
            <div v-if="luckyDate">
                <div style="margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #1890ff">宜忌事项</div>
                <div class="converter-result">
                    <div style="margin-bottom: 16px">
                        <div
                            style="
                                font-weight: 600;
                                color: #52c41a;
                                margin-bottom: 8px;
                                display: flex;
                                align-items: center;
                            "
                        >
                            <span
                                style="
                                    display: inline-block;
                                    width: 4px;
                                    height: 16px;
                                    background: #52c41a;
                                    margin-right: 8px;
                                "
                            ></span>
                            宜
                        </div>
                        <div style="color: #333; line-height: 1.8; padding-left: 12px">
                            {{ getLuckyYi(luckyDate) }}
                        </div>
                    </div>
                    <div>
                        <div
                            style="
                                font-weight: 600;
                                color: #ff4d4f;
                                margin-bottom: 8px;
                                display: flex;
                                align-items: center;
                            "
                        >
                            <span
                                style="
                                    display: inline-block;
                                    width: 4px;
                                    height: 16px;
                                    background: #ff4d4f;
                                    margin-right: 8px;
                                "
                            ></span>
                            忌
                        </div>
                        <div style="color: #333; line-height: 1.8; padding-left: 12px">
                            {{ getLuckyJi(luckyDate) }}
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
import { Lunar } from 'lunar-javascript';

const luckyDate = ref(dayjs());

function getLuckyYi(date) {
    const lunar = Lunar.fromDate(date.toDate());
    const yi = lunar.getDayYi();
    return yi.length > 0 ? yi.join(' ') : '诸事不宜';
}

function getLuckyJi(date) {
    const lunar = Lunar.fromDate(date.toDate());
    const ji = lunar.getDayJi();
    return ji.length > 0 ? ji.join(' ') : '百无禁忌';
}
</script>

<style scoped>
.converter-result {
    background: #f5f7fa;
    padding: 16px;
    border-radius: 8px;
}
</style>
