<template>
    <div class="holiday-list">
        <div style="max-height: 500px; overflow-y: auto">
            <a-tabs v-model:active-key="holidayTab">
                <a-tab-pane key="legal" tab="法定节假日">
                    <a-list :data-source="legalHolidays" size="small">
                        <template #renderItem="{ item }">
                            <a-list-item>
                                <a-list-item-meta>
                                    <template #title>
                                        <span style="color: #ff4d4f; font-weight: 500">{{ item.name }}</span>
                                    </template>
                                    <template #description>
                                        {{ item.date }}
                                        <span v-if="item.days" style="margin-left: 8px; color: #52c41a">
                                            (放假{{ item.days }}天)
                                        </span>
                                    </template>
                                </a-list-item-meta>
                            </a-list-item>
                        </template>
                    </a-list>
                </a-tab-pane>
                <a-tab-pane key="traditional" tab="传统节日">
                    <a-list :data-source="traditionalHolidays" size="small">
                        <template #renderItem="{ item }">
                            <a-list-item>
                                <a-list-item-meta>
                                    <template #title>{{ item.name }}</template>
                                    <template #description>{{ item.lunarDate }}</template>
                                </a-list-item-meta>
                            </a-list-item>
                        </template>
                    </a-list>
                </a-tab-pane>
                <a-tab-pane key="solar" tab="24节气">
                    <a-list :data-source="solarTerms" :grid="{ gutter: 16, column: 2 }" size="small">
                        <template #renderItem="{ item }">
                            <a-card size="small">
                                <div style="text-align: center">
                                    <div style="font-weight: 500; margin-bottom: 4px">{{ item.name }}</div>
                                    <div style="color: #888; font-size: 12px">{{ item.date }}</div>
                                </div>
                            </a-card>
                        </template>
                    </a-list>
                </a-tab-pane>
            </a-tabs>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const holidayTab = ref('legal');

const legalHolidays = ref([
    { name: '元旦', date: '2026-01-01', days: 3 },
    { name: '春节', date: '2026-02-17~02-23', days: 7 },
    { name: '清明节', date: '2026-04-05~04-07', days: 3 },
    { name: '劳动节', date: '2026-05-01~05-03', days: 3 },
    { name: '端午节', date: '2026-06-25~06-27', days: 3 },
    { name: '中秋节', date: '2026-10-06~10-08', days: 3 },
    { name: '国庆节', date: '2026-10-01~10-07', days: 7 }
]);

const traditionalHolidays = ref([
    { name: '除夕', lunarDate: '农历腊月三十' },
    { name: '春节', lunarDate: '农历正月初一' },
    { name: '元宵节', lunarDate: '农历正月十五' },
    { name: '龙抬头', lunarDate: '农历二月初二' },
    { name: '清明节', lunarDate: '清明节气' },
    { name: '端午节', lunarDate: '农历五月初五' },
    { name: '七夕节', lunarDate: '农历七月初七' },
    { name: '中元节', lunarDate: '农历七月十五' },
    { name: '中秋节', lunarDate: '农历八月十五' },
    { name: '重阳节', lunarDate: '农历九月初九' },
    { name: '寒衣节', lunarDate: '农历十月初一' },
    { name: '冬至节', lunarDate: '冬至节气' },
    { name: '腊八节', lunarDate: '农历腊月初八' }
]);

const solarTerms = ref([
    { name: '立春', date: '2月3-5日' },
    { name: '雨水', date: '2月18-20日' },
    { name: '惊蛰', date: '3月5-7日' },
    { name: '春分', date: '3月20-22日' },
    { name: '清明', date: '4月4-6日' },
    { name: '谷雨', date: '4月19-21日' },
    { name: '立夏', date: '5月5-7日' },
    { name: '小满', date: '5月20-22日' },
    { name: '芒种', date: '6月5-7日' },
    { name: '夏至', date: '6月21-22日' },
    { name: '小暑', date: '7月6-8日' },
    { name: '大暑', date: '7月22-24日' },
    { name: '立秋', date: '8月7-9日' },
    { name: '处暑', date: '8月22-24日' },
    { name: '白露', date: '9月7-9日' },
    { name: '秋分', date: '9月22-24日' },
    { name: '寒露', date: '10月8-9日' },
    { name: '霜降', date: '10月23-24日' },
    { name: '立冬', date: '11月7-8日' },
    { name: '小雪', date: '11月22-23日' },
    { name: '大雪', date: '12月6-8日' },
    { name: '冬至', date: '12月21-23日' },
    { name: '小寒', date: '1月5-7日' },
    { name: '大寒', date: '1月20-21日' }
]);
</script>
