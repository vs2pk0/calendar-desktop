<template>
    <div class="todo-form">
        <!-- 标题 -->
        <div class="form-item">
            <div class="form-label">标题</div>
            <a-input v-model:value="localData.title" placeholder="请输入待办标题" @change="emitUpdate" />
        </div>

        <!-- 时间 -->
        <div class="form-item">
            <div class="form-label">时间</div>
            <a-space>
                <a-date-picker
                    v-model:value="todoDate"
                    format="YYYY-MM-DD"
                    style="width: 200px"
                    @change="handleDateChange"
                />
                <a-time-picker
                    v-model:value="todoTime"
                    format="HH:mm"
                    style="width: 120px"
                    @change="handleTimeChange"
                />
            </a-space>
        </div>

        <!-- 提醒 -->
        <div class="form-item">
            <div class="form-label">提醒</div>
            <a-select v-model:value="localData.reminder" style="width: 100%" @change="emitUpdate">
                <a-select-option value="none">不提醒</a-select-option>
                <a-select-option value="开始时">开始时</a-select-option>
                <a-select-option value="5分钟前">5分钟前</a-select-option>
                <a-select-option value="15分钟前">15分钟前</a-select-option>
                <a-select-option value="30分钟前">30分钟前</a-select-option>
                <a-select-option value="1小时前">1小时前</a-select-option>
            </a-select>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import dayjs from 'dayjs';

const props = defineProps({
    formData: { type: Object, required: true }
});

const emit = defineEmits(['update']);

const localData = reactive({
    title: '',
    reminder: '开始时'
});

const todoDate = ref(dayjs());
const todoTime = ref(dayjs().hour(18).minute(0));

watch(
    () => props.formData,
    (data) => {
        Object.assign(localData, data);
        if (data.date) todoDate.value = dayjs(data.date);
        if (data.time) todoTime.value = dayjs(data.time, 'HH:mm');
    },
    { immediate: true, deep: true }
);

function handleDateChange() {
    emitUpdate();
}

function handleTimeChange() {
    emitUpdate();
}

function emitUpdate() {
    emit('update', {
        ...localData,
        date: todoDate.value.format('YYYY-MM-DD'),
        time: todoTime.value.format('HH:mm')
    });
}
</script>

<style scoped>
.todo-form {
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
    font-weight: 500;
    color: #333;
}
</style>
