<template>
  <div class="quick-record">
    <button class="record-btn" :disabled="loading || disabled" @click="handleClick">
      <span class="btn-icon">{{ loading ? '⏳' : '💩' }}</span>
      <span class="btn-text">{{ loading ? '保存中...' : '记录一次' }}</span>
    </button>

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">💩 今日大王的便便心情</h3>
          <button class="modal-close" @click="closeForm" :disabled="loading">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">选择心情</label>
            <div class="mood-options">
              <button
                v-for="m in moodOptions"
                :key="m.value"
                type="button"
                class="mood-chip"
                :class="{ active: mood === m.value }"
                @click="mood = m.value"
                :disabled="loading"
              >
                <span class="mood-emoji">{{ m.emoji }}</span>
                <span class="mood-text">{{ m.short }}</span>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">备注（可选）</label>
            <textarea
              v-model="note"
              class="note-textarea"
              placeholder="今天感觉怎么样？"
              rows="3"
              @keyup.enter.ctrl="confirmRecord"
              :disabled="loading"
            ></textarea>
          </div>
          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeForm" :disabled="loading">取消</button>
          <button class="btn-confirm" @click="confirmRecord" :disabled="loading">
            {{ loading ? '保存中...' : '确认记录' }}
          </button>
        </div>
      </div>
    </div>
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
  { value: '顺利', emoji: '🌊', short: '一泻千里' },
  { value: '正常', emoji: '😊', short: '轻松顺畅' },
  { value: '偏多', emoji: '🍽️', short: '意犹未尽' },
  { value: '费力', emoji: '💪', short: '费了老大劲' },
  { value: '便秘', emoji: '🔥', short: '艰难困苦' },
  { value: '腹泻', emoji: '💦', short: '一泻千里止不住' },
  { value: '舒适', emoji: '👑', short: '王者归来' },
  { value: '奇怪', emoji: '🤔', short: '形状奇怪' }
];

function handleClick() {
  if (props.disabled) return;
  showForm.value = true;
  errorMsg.value = '';
}

function closeForm() {
  if (loading.value) return;
  showForm.value = false;
  mood.value = '';
  note.value = '';
  errorMsg.value = '';
}

async function confirmRecord() {
  if (!mood.value) {
    errorMsg.value = '请选择今日大王的便便心情';
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    await addRecord(note.value, mood.value);
    closeForm();
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: white;
  border-radius: 18px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #e8e8e8;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.mood-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mood-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #f8f4ef;
  border: 2px solid transparent;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  color: #555;
  transition: all 0.15s ease;
}

.mood-chip:hover {
  background: #fff3e0;
  color: #8B4513;
}

.mood-chip.active {
  background: #8B4513;
  color: white;
  border-color: #6B3410;
}

.mood-emoji {
  font-size: 16px;
}

.mood-text {
  font-weight: 500;
}

.note-textarea {
  padding: 12px 14px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  line-height: 1.5;
}

.note-textarea:focus {
  border-color: #8B4513;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: #e8e8e8;
}

.btn-confirm {
  flex: 2;
  padding: 12px;
  background: linear-gradient(145deg, #8B4513, #A0522D);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.4);
}

.record-btn:disabled,
.btn-cancel:disabled,
.btn-confirm:disabled,
.mood-chip:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: #e53935;
  font-size: 13px;
  margin: 0;
}
</style>
