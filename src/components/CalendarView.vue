<template>
    <div class="calendar-container">
        <!-- Toolbar -->
        <div class="calendar-header">
            <div class="left-controls">
                <a-radio-group v-model:value="viewMode" button-style="solid">
                    <a-radio-button value="month">{{ currentYearMonth }}</a-radio-button>
                    <a-radio-button value="year">假期安排</a-radio-button>
                </a-radio-group>
            </div>

            <div class="center-controls"></div>

            <div class="right-controls">
                <a-button shape="circle" @click="prevMonth">
                    <template #icon><LeftOutlined /></template>
                </a-button>
                <a-button shape="circle" @click="nextMonth" style="margin: 0 8px">
                    <template #icon><RightOutlined /></template>
                </a-button>
                <a-button @click="goToday" style="margin-right: 8px">今日</a-button>
                <a-button type="text">
                    <FilterOutlined />
                </a-button>
                <a-button type="text">
                    <CalendarOutlined />
                </a-button>
                <a-button type="primary" shape="circle">
                    <template #icon><PlusOutlined /></template>
                </a-button>
            </div>
        </div>

        <!-- Weekday Headers -->
        <div class="weekday-header">
            <div v-for="(day, index) in weekDays" :key="index" class="weekday-item" :class="{ weekend: index >= 5 }">
                {{ day }}
            </div>
        </div>

        <!-- Calendar Grid -->
        <div class="calendar-grid">
            <div
                v-for="(date, index) in calendarDays"
                :key="index"
                class="calendar-cell"
                :class="{
                    'other-month': !date.isCurrentMonth,
                    today: date.isToday,
                    selected: isSelected(date)
                }"
                @click="selectDate(date)"
            >
                <div class="date-header">
                    <span class="solar-day">{{ date.day }}</span>
                </div>
                <div class="lunar-day" :class="{ festival: date.festival }">
                    {{ date.festival || date.lunarDayName }}
                </div>
                <div v-if="date.term" class="solar-term">{{ date.term }}</div>

                <!-- 日程标记小圆点 -->
                <div v-if="date.scheduleCount > 0" class="schedule-indicator">
                    <div class="schedule-dot"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import dayjs from 'dayjs';
import { Lunar } from 'lunar-javascript';
import { LeftOutlined, RightOutlined, FilterOutlined, CalendarOutlined, PlusOutlined } from '@ant-design/icons-vue';
import scheduleManager from '../utils/scheduleManager';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue', 'select']);

const currentDate = ref(props.modelValue ? dayjs(props.modelValue) : dayjs()); // 默认为 props 或 今天
const selectedDate = ref(props.modelValue ? dayjs(props.modelValue) : dayjs());
const viewMode = ref('month');
const holidayData = ref({});
const monthSchedules = ref([]);

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const scheduleCounts = ref({});

// 加载当前显示的月份的日程
async function loadMonthSchedules() {
    const year = currentDate.value.year();
    const month = currentDate.value.month() + 1;
    const schedules = await scheduleManager.getSchedulesByMonth(year, month);

    // 计算统计
    const counts = {};
    schedules.forEach((s) => {
        counts[s.date] = (counts[s.date] || 0) + 1;
    });
    scheduleCounts.value = counts;
}

// 供外部调用以刷新日程
async function refresh() {
    await loadMonthSchedules();
}

// 暴露 refresh 方法
defineExpose({
    refresh
});

// 动态显示当前年月
const currentYearMonth = computed(() => {
    return `${currentDate.value.year()}年${currentDate.value.month() + 1}月`;
});

// 获取假期数据
async function fetchHolidays() {
    try {
        const year = currentDate.value.year();
        const response = await fetch(`https://timor.tech/api/holiday/year/${year}`);
        const data = await response.json();

        if (data.code === 0) {
            holidayData.value = data.holiday || {};
        }
    } catch (error) {
        console.error('获取假期数据失败:', error);
    }
}

onMounted(async () => {
    await fetchHolidays();
    await loadMonthSchedules();
});

// 监听日期变化，重新加载日程和假期
watch(currentDate, async () => {
    await fetchHolidays();
    await loadMonthSchedules();
});

const calendarDays = computed(() => {
    const year = currentDate.value.year();
    const month = currentDate.value.month(); // 0-11
    const startOfMonth = currentDate.value.startOf('month');
    const endOfMonth = currentDate.value.endOf('month');

    const startDayOfWeek = startOfMonth.day() === 0 ? 7 : startOfMonth.day(); // 1(Mon) - 7(Sun)

    const days = [];

    // Previous month padding
    const prevMonthEnd = startOfMonth.subtract(1, 'day');
    const paddingBefore = startDayOfWeek - 1;
    for (let i = paddingBefore - 1; i >= 0; i--) {
        const d = startOfMonth.subtract(i + 1, 'day');
        days.push(createDateObject(d, false));
    }

    // Current month
    for (let i = 0; i < endOfMonth.date(); i++) {
        const d = startOfMonth.add(i, 'day');
        days.push(createDateObject(d, true));
    }

    // Next month padding
    const totalCells = 42; // 6 rows * 7
    const remaining = totalCells - days.length;
    for (let i = 0; i < remaining; i++) {
        const d = endOfMonth.add(i + 1, 'day');
        days.push(createDateObject(d, false));
    }

    return days;
});

function createDateObject(dateObj, isCurrentMonth) {
    const lunar = Lunar.fromDate(dateObj.toDate());
    const dateStr = dateObj.format('YYYY-MM-DD');
    const holidayInfo = holidayData.value[dateStr];

    // 从缓存中获取该日期的日程数量
    const scheduleCount = scheduleCounts.value[dateStr] || 0;

    // 优先显示法定节假日，否则显示农历节日或节气
    let festival = null;
    if (holidayInfo && holidayInfo.name) {
        festival = holidayInfo.name;
    } else {
        const festivals = lunar.getFestivals();
        festival = festivals.length > 0 ? festivals[0] : null;
    }

    return {
        dateObj: dateObj,
        day: dateObj.date(),
        isCurrentMonth,
        isToday: dateObj.isSame(dayjs(), 'day'),
        lunarDayName: lunar.getDayInChinese(),
        term: lunar.getJieQi(),
        festival: festival,
        scheduleCount: scheduleCount,
        isHoliday: holidayInfo && holidayInfo.holiday === true,
        isWorkday: holidayInfo && holidayInfo.wage === 3 // wage为3表示调休工作日
    };
}

function prevMonth() {
    currentDate.value = currentDate.value.subtract(1, 'month');
}
function nextMonth() {
    currentDate.value = currentDate.value.add(1, 'month');
}
function goToday() {
    currentDate.value = dayjs();
    selectedDate.value = dayjs();
    emit('select', createDateObject(dayjs(), true));
}
function isSelected(date) {
    return selectedDate.value && date.dateObj.isSame(selectedDate.value, 'day');
}
function selectDate(date) {
    selectedDate.value = date.dateObj;
    emit('select', date);
}
</script>

<style scoped>
.calendar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
    background: white;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.weekday-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    margin-bottom: 8px;
    font-weight: 500;
    color: #666;
}

.weekday-item {
    padding: 8px 0;
}
.weekend {
    color: #ff4d4f;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
    flex: 1;
    border-top: 1px solid #f0f0f0;
    border-left: 1px solid #f0f0f0;
}

.calendar-cell {
    border-right: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;
    padding: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    position: relative;
}

.calendar-cell:hover {
    background-color: #f5f7fa;
}

.calendar-cell.selected {
    background-color: #e6f7ff;
    border: 2px solid #1890ff; /* Ant Design Blue */
    z-index: 1;
}

.other-month {
    color: #ccc;
    background-color: #fafafa;
}

.date-header {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
}

.lunar-day {
    font-size: 12px;
    color: #888;
}

.festival {
    color: #ff4d4f;
}

.solar-term {
    font-size: 12px;
    color: #1890ff;
    margin-top: 2px;
}

.today .date-header {
    color: #1890ff;
}

.schedule-indicator {
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    justify-content: center;
}

.schedule-dot {
    width: 6px;
    height: 6px;
    background-color: #1890ff;
    border-radius: 50%;
}
</style>
