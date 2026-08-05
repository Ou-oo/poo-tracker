<template>
  <div class="quick-record">
    <button class="record-btn" :disabled="loading || disabled" @click="handleClick">
      <span class="btn-icon">{{ loading ? '⏳' : '💩' }}</span>
      <span class="btn-text">{{ loading ? '保存中...' : '记录一次' }}</span>
    </button>
    <div v-if="showForm" class="record-form">
      <div class="form-row">
        <label class="form-label">今日便便心情</label>
        <select v-model="mood" class="mood-select" :disabled="loading || disabled">
          <option value="" disabled>选择心情</option>
          <option v-for="m in moodOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>
      <div class="form-row">
        <input
          v-model="note"
          type="text"
          class="note-input"
          placeholder="添加备注（可选）"
          @keyup.enter="confirmRecord"
          :disabled="loading || disabled"
        />
      </div>
      <button class="confirm-btn" @click="confirmRecord" :disabled="loading || disabled">
        {{ loading ? '保存中...' : '确认记录' }}
      </button>
    </div>
    <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { addRecord } from '../utils/storage';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['recorded']);
const showForm = ref(false);
const mood = ref('');
const note = ref('');
const loading = ref(false);
const errorMsg = ref('');

const moodOptions = [
  { value: '顺利', label: '🌊 一泻千里' },
  { value: '正常', label: '😊 轻松顺畅' },
  { value: '偏多', label: '🍽️ 意犹未尽' },
  { value: '费力', label: '💪 费了老大劲' },
  { value: '便秘', label: '🔥 艰难困苦' },
  { value: '腹泻', label: '💦 一泻千里止不住' },
  { value: '舒适', label: '👑 王者归来' },
  { value: '奇怪', label: '🤔 形状奇怪' }
];

function handleClick() {
  if (props.disabled) return;
  showForm.value = true;
  errorMsg.value = '';
}

async function confirmRecord() {
  if (!mood.value) {
    errorMsg.value = '请选择今日便便心情';
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    await addRecord(note.value, mood.value);
    note.value = '';
    mood.value = '';
    showForm.value = false;
    emit('recorded');
  } catch (e) {
    console.error('保存失败:', e);
    errorMsg.value = '保存失败，请重试';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.quick-record {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.record-btn {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(145deg, #8B4513, #A0522D);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(139, 69, 19, 0.4);
  transition: all 0.2s ease;
}

.record-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 35px rgba(139, 69, 19, 0.5);
}

.record-btn:active {
  transform: scale(0.98);
}

.btn-icon {
  font-size: 42px;
  line-height: 1;
}

.btn-text {
  font-size: 14px;
  margin-top: 4px;
  font-weight: 500;
}

.record-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  background: #fff8e1;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #ffe0b2;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.mood-select {
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  background: white;
  transition: border-color 0.2s;
  cursor: pointer;
}

.mood-select:focus {
  border-color: #8B4513;
}

.mood-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.note-input {
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.note-input:focus {
  border-color: #8B4513;
}

.confirm-btn {
  padding: 12px 24px;
  background: #8B4513;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.confirm-btn:hover {
  background: #6B3410;
}

.record-btn:disabled,
.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: #e53935;
  font-size: 13px;
  margin: 0;
}
</style>
