<template>
  <div class="quick-record">
    <button class="record-btn" :disabled="loading" @click="handleClick">
      <span class="btn-icon">{{ loading ? '⏳' : '💩' }}</span>
      <span class="btn-text">{{ loading ? '保存中...' : '记录一次' }}</span>
    </button>
    <div v-if="showNote" class="note-input-wrapper">
      <input
        v-model="note"
        type="text"
        class="note-input"
        placeholder="添加备注（可选）"
        @keyup.enter="confirmNote"
        autofocus
        :disabled="loading"
      />
      <button class="confirm-btn" @click="confirmNote" :disabled="loading">
        {{ loading ? '...' : '确认' }}
      </button>
    </div>
    <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { addRecord } from '../utils/storage';

const emit = defineEmits(['recorded']);
const showNote = ref(false);
const note = ref('');
const loading = ref(false);
const errorMsg = ref('');

function handleClick() {
  showNote.value = true;
  errorMsg.value = '';
}

async function confirmNote() {
  loading.value = true;
  errorMsg.value = '';
  try {
    await addRecord(note.value);
    note.value = '';
    showNote.value = false;
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

.note-input-wrapper {
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 320px;
}

.note-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
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
