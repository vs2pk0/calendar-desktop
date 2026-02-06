<template>
    <div class="countdown-form">
        <div class="form-item">
            <div class="form-label">内容</div>
            <a-input v-model:value="localData.title" placeholder="请输入倒数日内容" @change="emitUpdate" />
        </div>
        <div class="form-item">
            <div class="form-label">时间</div>
            <a-date-picker
                v-model:value="countdownDate"
                format="YYYY-MM-DD"
                style="width: 100%"
                @change="handleDateChange"
            />
        </div>
        <div class="form-item">
            <div class="form-label">提醒</div>
            <a-select v-model:value="localData.reminder" style="width: 100%" @change="emitUpdate">
                <a-select-option value="开始时">开始时</a-select-option>
                <a-select-option value="1天前">1天前</a-select-option>
                <a-select-option value="7天前">7天前</a-select-option>
            </a-select>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import dayjs from 'dayjs';

const props = defineProps({ formData: { type: Object, required: true } });
const emit = defineEmits(['update']);

const localData = reactive({ title: '', reminder: '1天前' });
const countdownDate = ref(dayjs().add(30, 'day'));

watch(
    () => props.formData,
    (data) => {
        Object.assign(localData, data);
        if (data.date) countdownDate.value = dayjs(data.date);
    },
    { immediate: true, deep: true }
);

function handleDateChange() {
    emitUpdate();
}

function emitUpdate() {
    emit('update', { ...localData, date: countdownDate.value.format('YYYY-MM-DD'), isAllDay: true });
}
</script>

<style scoped>
.countdown-form {
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
