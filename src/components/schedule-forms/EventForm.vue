<template>
    <div class="event-form">
        <!-- 标题 -->
        <div class="form-item">
            <div class="form-label">
                <check-square-outlined />
                <span>标题</span>
            </div>
            <a-input v-model:value="localData.title" placeholder="请输入日程标题" @change="emitUpdate" />
        </div>

        <!-- 全天开关 -->
        <div class="form-item">
            <div class="form-label">
                <clock-circle-outlined />
                <span>全天</span>
            </div>
            <a-switch v-model:checked="localData.isAllDay" @change="emitUpdate" />
        </div>

        <!-- 公历/农历 -->
        <div class="form-item">
            <a-radio-group v-model:value="localData.isLunar" @change="emitUpdate">
                <a-radio :value="false">公历</a-radio>
                <a-radio :value="true">农历</a-radio>
            </a-radio-group>
        </div>

        <!-- 开始时间 -->
        <div class="form-item">
            <div class="form-label">开始</div>
            <a-space>
                <a-date-picker
                    v-model:value="startDate"
                    format="YYYY-MM-DD"
                    style="width: 200px"
                    @change="handleStartDateChange"
                />
                <a-time-picker
                    v-if="!localData.isAllDay"
                    v-model:value="startTime"
                    format="HH:mm"
                    style="width: 120px"
                    @change="handleStartTimeChange"
                />
            </a-space>
        </div>

        <!-- 结束时间 -->
        <div class="form-item">
            <div class="form-label">结束</div>
            <a-space>
                <a-date-picker
                    v-model:value="endDate"
                    format="YYYY-MM-DD"
                    style="width: 200px"
                    @change="handleEndDateChange"
                />
                <a-time-picker
                    v-if="!localData.isAllDay"
                    v-model:value="endTime"
                    format="HH:mm"
                    style="width: 120px"
                    @change="handleEndTimeChange"
                />
            </a-space>
        </div>

        <!-- 提醒 -->
        <div class="form-item">
            <div class="form-label">
                <bell-outlined />
                <span>提醒</span>
            </div>
            <a-select v-model:value="localData.reminder" style="width: 100%" @change="emitUpdate">
                <a-select-option value="none">不提醒</a-select-option>
                <a-select-option value="开始时">开始时</a-select-option>
                <a-select-option value="5分钟前">5分钟前</a-select-option>
                <a-select-option value="15分钟前">15分钟前</a-select-option>
                <a-select-option value="30分钟前">30分钟前</a-select-option>
                <a-select-option value="1小时前">1小时前</a-select-option>
                <a-select-option value="1天前">1天前</a-select-option>
            </a-select>
        </div>

        <!-- 时区 -->
        <div class="form-item">
            <div class="form-label">
                <global-outlined />
                <span>时区</span>
            </div>
            <a-select v-model:value="localData.timezone" style="width: 100%" @change="emitUpdate">
                <a-select-option value="GMT+8:00">(GMT+8:00) 北京</a-select-option>
            </a-select>
        </div>

        <!-- 重复 -->
        <div class="form-item">
            <div class="form-label">
                <sync-outlined />
                <span>重复</span>
            </div>
            <a-select v-model:value="localData.repeat" style="width: 100%" @change="emitUpdate">
                <a-select-option value="none">一次性日程</a-select-option>
                <a-select-option value="daily">每天</a-select-option>
                <a-select-option value="weekly">每周</a-select-option>
                <a-select-option value="monthly">每月</a-select-option>
                <a-select-option value="yearly">每年</a-select-option>
            </a-select>
        </div>

        <!-- 位置 -->
        <div class="form-item">
            <div class="form-label">
                <environment-outlined />
                <span>位置信息（可选）</span>
            </div>
            <a-input v-model:value="localData.location" placeholder="请输入位置信息" @change="emitUpdate" />
        </div>

        <!-- 备注 -->
        <div class="form-item">
            <div class="form-label">
                <file-text-outlined />
                <span>请添加备注（可选）</span>
            </div>
            <a-textarea v-model:value="localData.note" :rows="3" placeholder="请添加备注" @change="emitUpdate" />
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import dayjs from 'dayjs';
import {
    CheckSquareOutlined,
    ClockCircleOutlined,
    BellOutlined,
    GlobalOutlined,
    SyncOutlined,
    EnvironmentOutlined,
    FileTextOutlined
} from '@ant-design/icons-vue';

const props = defineProps({
    formData: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['update']);

const localData = reactive({
    title: '',
    isAllDay: false,
    isLunar: false,
    reminder: '开始时',
    timezone: 'GMT+8:00',
    repeat: 'none',
    location: '',
    note: ''
});

// 日期时间
const startDate = ref(dayjs());
const startTime = ref(dayjs().hour(18).minute(0));
const endDate = ref(dayjs());
const endTime = ref(dayjs().hour(19).minute(0));

// 监听 props 变化
watch(
    () => props.formData,
    (data) => {
        Object.assign(localData, data);
        if (data.date) {
            startDate.value = dayjs(data.date);
        }
        if (data.time) {
            startTime.value = dayjs(data.time, 'HH:mm');
        }
        if (data.endDate) {
            endDate.value = dayjs(data.endDate);
        }
        if (data.endTime) {
            endTime.value = dayjs(data.endTime, 'HH:mm');
        }
    },
    { immediate: true, deep: true }
);

// 处理日期时间变化
function handleStartDateChange() {
    emitUpdate();
}

function handleStartTimeChange() {
    emitUpdate();
}

function handleEndDateChange() {
    emitUpdate();
}

function handleEndTimeChange() {
    emitUpdate();
}

// 发送更新
function emitUpdate() {
    emit('update', {
        ...localData,
        date: startDate.value.format('YYYY-MM-DD'),
        time: startTime.value.format('HH:mm'),
        endDate: endDate.value.format('YYYY-MM-DD'),
        endTime: endTime.value.format('HH:mm')
    });
}
</script>

<style scoped>
.event-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
    color: #333;
}

.form-label .anticon {
    color: #666;
}
</style>
