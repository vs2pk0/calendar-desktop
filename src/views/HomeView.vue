<template>
    <div class="home-view-container">
        <CalendarView ref="calendarRef" v-model="currentDate" @select="handleDateSelect" />
    </div>
</template>

<script setup>
import { ref, defineExpose } from 'vue';
import CalendarView from '../components/CalendarView.vue';
import dayjs from 'dayjs';

const currentDate = ref(dayjs());
const calendarRef = ref(null);

const emit = defineEmits(['select']);

function handleDateSelect(date) {
    emit('select', date);
}

function refresh() {
    if (calendarRef.value) {
        calendarRef.value.refresh();
    }
}

defineExpose({ refresh });
</script>

<style scoped>
.home-view-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
}
</style>
