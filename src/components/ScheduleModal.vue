<template>
    <a-modal
        v-model:open="visible"
        :title="editingSchedule ? '修改日程' : '添加日程'"
        width="600px"
        ok-text="确定"
        cancel-text="取消"
        centered
        :confirm-loading="saving"
        @ok="handleSave"
        @cancel="handleCancel"
    >
        <div class="modal-scroll-content">
            <!-- 日历选择 -->
            <div style="margin-bottom: 16px">
                <div style="margin-bottom: 8px; font-weight: 500">日历选择：</div>
                <a-select v-model:value="formData.calendar" style="width: 100%">
                    <a-select-option value="my">我的日历</a-select-option>
                </a-select>
                <a-button type="link" style="padding: 0; margin-top: 4px">日历管理</a-button>
            </div>

            <!-- 类型Tab -->
            <a-tabs v-model:activeKey="formData.type" @change="handleTypeChange">
                <a-tab-pane key="todo" tab="待办">
                    <TodoForm ref="todoFormRef" :form-data="formData" @update="updateFormData" />
                </a-tab-pane>
                <a-tab-pane key="event" tab="日程">
                    <EventForm ref="eventFormRef" :form-data="formData" @update="updateFormData" />
                </a-tab-pane>
                <a-tab-pane key="birthday" tab="生日">
                    <BirthdayForm ref="birthdayFormRef" :form-data="formData" @update="updateFormData" />
                </a-tab-pane>
                <a-tab-pane key="anniversary" tab="纪念日">
                    <AnniversaryForm ref="anniversaryFormRef" :form-data="formData" @update="updateFormData" />
                </a-tab-pane>
                <a-tab-pane key="countdown" tab="倒数日">
                    <CountdownForm ref="countdownFormRef" :form-data="formData" @update="updateFormData" />
                </a-tab-pane>
            </a-tabs>
        </div>
    </a-modal>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import dayjs from 'dayjs';
import TodoForm from './schedule-forms/TodoForm.vue';
import EventForm from './schedule-forms/EventForm.vue';
import BirthdayForm from './schedule-forms/BirthdayForm.vue';
import AnniversaryForm from './schedule-forms/AnniversaryForm.vue';
import CountdownForm from './schedule-forms/CountdownForm.vue';
import scheduleManager from '../utils/scheduleManager';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    initialDate: {
        type: String,
        default: ''
    },
    editingSchedule: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const visible = ref(false);
const saving = ref(false);

// 表单数据
const formData = reactive({
    calendar: 'my',
    type: 'event',
    title: '',
    date: dayjs().format('YYYY-MM-DD'),
    time: '18:00',
    endDate: dayjs().format('YYYY-MM-DD'),
    endTime: '19:00',
    isAllDay: false,
    isLunar: false,
    reminder: '开始时',
    location: '',
    note: '',
    repeat: 'none'
});

// 监听 modelValue 变化
watch(
    () => props.modelValue,
    (val) => {
        visible.value = val;
        if (val) {
            if (props.editingSchedule) {
                // 如果是编辑模式，填充数据
                Object.assign(formData, props.editingSchedule);
            } else if (props.initialDate) {
                // 如果是新建模式，设置初始日期
                formData.date = props.initialDate;
                formData.endDate = props.initialDate;
                resetFormFields();
            } else {
                resetForm();
            }
        }
    }
);

watch(visible, (val) => {
    emit('update:modelValue', val);
});

// 更新表单数据
function updateFormData(updates) {
    Object.assign(formData, updates);
}

// 切换类型时重置部分数据
function handleTypeChange(type) {
    // 根据类型设置默认值
    if (type === 'todo') {
        formData.isAllDay = false;
    } else if (type === 'birthday' || type === 'anniversary') {
        formData.isAllDay = true;
    }
}

// 保存
async function handleSave() {
    // 验证表单
    if (!formData.title) {
        return;
    }

    try {
        saving.value = true;
        let result;
        if (props.editingSchedule) {
            // 更新
            result = await scheduleManager.updateSchedule(props.editingSchedule.id, formData);
        } else {
            // 新增
            result = await scheduleManager.addSchedule(formData);
        }

        // 触发保存事件
        emit('saved', result);

        // 关闭弹窗
        visible.value = false;

        // 重置表单
        resetForm();
    } catch (e) {
        console.error('保存日程失败:', e);
        alert('保存日程失败：' + (e.message || e));
    } finally {
        saving.value = false;
    }
}

// 取消
function handleCancel() {
    visible.value = false;
    resetForm();
}

function resetFormFields() {
    formData.title = '';
    formData.location = '';
    formData.note = '';
}

// 重置表单
function resetForm() {
    formData.type = 'event';
    formData.title = '';
    formData.date = dayjs().format('YYYY-MM-DD');
    formData.time = '18:00';
    formData.endDate = dayjs().format('YYYY-MM-DD');
    formData.endTime = '19:00';
    formData.isAllDay = false;
    formData.isLunar = false;
    formData.reminder = '开始时';
    formData.location = '';
    formData.note = '';
    formData.repeat = 'none';
}
</script>

<style scoped>
:deep(.ant-tabs-nav) {
    margin-bottom: 16px;
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
}

.modal-scroll-content {
    max-height: 65vh;
    overflow-y: auto;
    padding: 0 4px 20px 4px;
}

/* 优化滚动条 */
.modal-scroll-content::-webkit-scrollbar {
    width: 6px;
}

.modal-scroll-content::-webkit-scrollbar-thumb {
    background: #e8e8e8;
    border-radius: 3px;
}

.modal-scroll-content::-webkit-scrollbar-thumb:hover {
    background: #ccc;
}
</style>
