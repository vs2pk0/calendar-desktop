# 日程管理功能 - 快速完成指南

## 🎯 当前状态

✅ **已完成**：

- 数据管理层（scheduleManager.js）
- 日程创建弹窗（ScheduleModal.vue）
- 5种类型的表单组件
- "创建日程"按钮集成

⏳ **待完成**：

- 在日历上显示日程标记
- 在右侧面板显示日程列表
- 编辑和删除功能

---

## 📋 Step 1: 在日历上显示日程标记

### 需要修改的文件

`src/components/CalendarView.vue`

### 实现代码

```vue
<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import dayjs from 'dayjs';
import scheduleManager from '../utils/scheduleManager';

// ... 现有代码 ...

// 添加：日程数据
const schedules = ref([]);

// 添加：加载当月日程
function loadMonthSchedules() {
    const year = currentDate.value.year();
    const month = currentDate.value.month() + 1;
    schedules.value = scheduleManager.getSchedulesByMonth(year, month);
}

// 添加：获取指定日期的日程数量
function getScheduleCount(date) {
    const dateStr = date.format('YYYY-MM-DD');
    return schedules.value.filter((s) => s.date === dateStr).length;
}

// 添加：在 onMounted 中加载
onMounted(() => {
    loadMonthSchedules();
});

// 添加：监听月份变化
watch(currentDate, () => {
    loadMonthSchedules();
});
</script>

<template>
    <!-- 在日期格子中添加标记 -->
    <div class="calendar-day" :class="{ 'is-today': isToday(day) }">
        <div class="day-number">{{ day.date() }}</div>

        <!-- 添加这部分：日程标记 -->
        <div v-if="getScheduleCount(day) > 0" class="schedule-indicator">
            <div class="schedule-dot"></div>
            <span v-if="getScheduleCount(day) > 1" class="schedule-count">
                {{ getScheduleCount(day) }}
            </span>
        </div>
    </div>
</template>

<style scoped>
.schedule-indicator {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
}

.schedule-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: #1890ff;
}

.schedule-count {
    font-size: 10px;
    color: #1890ff;
    font-weight: 500;
}
</style>
```

---

## 📋 Step 2: 在右侧面板显示日程列表

### 需要修改的文件

`src/components/RightPanel.vue`

### 实现代码

#### 1. 添加导入和状态

```vue
<script setup>
import scheduleManager from '../utils/scheduleManager';

// 添加：当天日程列表
const todaySchedules = ref([]);

// 添加：加载当天日程
function loadTodaySchedules() {
    const dateStr = currentDateObj.value.format('YYYY-MM-DD');
    todaySchedules.value = scheduleManager.getSchedulesByDate(dateStr);
}

// 添加：监听日期变化
watch(currentDateObj, () => {
    loadTodaySchedules();
});

// 添加：在 onMounted 中加载
onMounted(() => {
    loadTodaySchedules();
});

// 添加：删除日程
function deleteSchedule(id) {
    if (confirm('确定要删除这个日程吗？')) {
        scheduleManager.deleteSchedule(id);
        loadTodaySchedules();
    }
}

// 添加：编辑日程
function editSchedule(schedule) {
    // TODO: 打开编辑弹窗
    console.log('编辑日程:', schedule);
}

// 修改：保存回调，刷新列表
function handleScheduleSaved(schedule) {
    console.log('日程已保存:', schedule);
    loadTodaySchedules(); // 刷新列表
}
</script>

<template>
    <!-- 在农历卡片后添加日程列表 -->
    <div v-if="todaySchedules.length > 0" class="info-card schedule-list-card">
        <div class="card-title">我的日程</div>
        <div class="schedule-list">
            <div v-for="schedule in todaySchedules" :key="schedule.id" class="schedule-item">
                <div class="schedule-icon" :class="`schedule-type-${schedule.type}`">
                    <calendar-outlined v-if="schedule.type === 'event'" />
                    <check-square-outlined v-if="schedule.type === 'todo'" />
                    <gift-outlined v-if="schedule.type === 'birthday'" />
                    <heart-outlined v-if="schedule.type === 'anniversary'" />
                    <clock-circle-outlined v-if="schedule.type === 'countdown'" />
                </div>
                <div class="schedule-content">
                    <div class="schedule-title">{{ schedule.title }}</div>
                    <div class="schedule-time">
                        <span v-if="!schedule.isAllDay">{{ schedule.time }}</span>
                        <span v-else>全天</span>
                        <span v-if="schedule.location"> · {{ schedule.location }}</span>
                    </div>
                </div>
                <div class="schedule-actions">
                    <a-button type="text" size="small" @click="editSchedule(schedule)"> 编辑 </a-button>
                    <a-button type="text" size="small" danger @click="deleteSchedule(schedule.id)"> 删除 </a-button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.schedule-list-card {
    margin-top: 16px;
}

.card-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #333;
}

.schedule-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.schedule-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f5f5f5;
    border-radius: 8px;
    transition: all 0.3s;
}

.schedule-item:hover {
    background: #e6f7ff;
}

.schedule-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: white;
}

.schedule-type-todo {
    background: #1890ff;
}
.schedule-type-event {
    background: #52c41a;
}
.schedule-type-birthday {
    background: #eb2f96;
}
.schedule-type-anniversary {
    background: #722ed1;
}
.schedule-type-countdown {
    background: #fa8c16;
}

.schedule-content {
    flex: 1;
}

.schedule-title {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
}

.schedule-time {
    font-size: 12px;
    color: #999;
}

.schedule-actions {
    display: flex;
    gap: 4px;
}
</style>
```

---

## 📋 Step 3: 实现编辑功能

### 修改 ScheduleModal.vue

```vue
<script setup>
const props = defineProps({
    modelValue: { type: Boolean, default: false },
    initialDate: { type: String, default: '' },
    editingSchedule: { type: Object, default: null } // 添加这个
});

// 监听编辑数据
watch(
    () => props.editingSchedule,
    (schedule) => {
        if (schedule) {
            // 填充表单数据
            Object.assign(formData, schedule);
        }
    },
    { immediate: true }
);

// 修改保存函数
function handleSave() {
    if (!formData.title) return;

    let schedule;
    if (props.editingSchedule) {
        // 更新现有日程
        schedule = scheduleManager.updateSchedule(props.editingSchedule.id, formData);
    } else {
        // 创建新日程
        schedule = scheduleManager.addSchedule(formData);
    }

    emit('saved', schedule);
    visible.value = false;
    resetForm();
}
</script>
```

### 修改 RightPanel.vue

```vue
<script setup>
// 添加：编辑中的日程
const editingSchedule = ref(null);

// 修改：编辑日程函数
function editSchedule(schedule) {
    editingSchedule.value = schedule;
    scheduleModalVisible.value = true;
}

// 修改：显示日程弹窗函数
function showScheduleModal() {
    editingSchedule.value = null; // 清空编辑状态
    scheduleModalVisible.value = true;
}
</script>

<template>
    <!-- 修改 ScheduleModal -->
    <ScheduleModal
        v-model="scheduleModalVisible"
        :initial-date="currentDateObj.format('YYYY-MM-DD')"
        :editing-schedule="editingSchedule"
        @saved="handleScheduleSaved"
    />
</template>
```

---

## 🎯 完成后的效果

### 1. 日历视图

- 有日程的日期显示蓝色小圆点
- 多个日程显示数字徽章（如 "3"）

### 2. 右侧面板

- 显示"我的日程"卡片
- 列出当天的所有日程
- 每条日程显示：
    - 类型图标（不同颜色）
    - 标题
    - 时间/全天标识
    - 位置（如果有）
    - 编辑和删除按钮

### 3. 交互流程

```
点击"创建日程" → 填写表单 → 保存
    ↓
日历上显示标记
    ↓
右侧面板显示列表
    ↓
点击"编辑" → 修改信息 → 保存
    ↓
点击"删除" → 确认 → 删除
```

---

## 🚀 快速测试

1. **创建日程**：

    ```
    - 点击"创建日程"
    - 选择"日程"类型
    - 输入标题："测试日程"
    - 选择今天的日期
    - 点击"确定"
    ```

2. **查看效果**：

    ```
    - 日历上今天的日期应该显示蓝色小圆点
    - 右侧面板应该显示"我的日程"卡片
    - 卡片中显示刚创建的日程
    ```

3. **编辑日程**：

    ```
    - 点击日程的"编辑"按钮
    - 修改标题为："测试日程（已修改）"
    - 点击"确定"
    - 列表应该更新
    ```

4. **删除日程**：
    ```
    - 点击日程的"删除"按钮
    - 确认删除
    - 日程从列表中消失
    - 日历上的标记也消失
    ```

---

## 📝 注意事项

1. **数据持久化**：
    - 所有数据存储在 localStorage
    - 刷新页面后数据仍然存在

2. **性能优化**：
    - 只加载当月的日程数据
    - 切换月份时重新加载

3. **用户体验**：
    - 删除前显示确认对话框
    - 保存后自动刷新列表
    - 编辑时预填充现有数据

---

## 🎉 完成！

按照以上步骤实现后，您将拥有一个功能完整的日程管理系统！

如果需要更多功能（如重复日程、提醒等），可以参考 `SCHEDULE_IMPLEMENTATION.md` 文档。
