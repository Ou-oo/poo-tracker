<template>
  <div class="user-header">
    <div class="user-info" @click="editing = true">
      <span class="user-label">你好，</span>
      <span class="user-nickname" v-if="!editing">{{ nickname }}</span>
      <input
        v-else
        v-model="newNickname"
        class="nickname-input"
        @keyup.enter="saveNickname"
        @blur="saveNickname"
        autofocus
        maxlength="20"
      />
      <span class="edit-hint" v-if="!editing">✏️</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  nickname: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['change']);
const editing = ref(false);
const newNickname = ref('');

function saveNickname() {
  if (newNickname.value.trim()) {
    emit('change', newNickname.value.trim());
  }
  editing.value = false;
}

function startEdit() {
  newNickname.value = props.nickname;
  editing.value = true;
}
</script>

<style scoped>
.user-header {
  display: flex;
  justify-content: center;
  padding: 0 20px 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 6px 16px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;
}

.user-info:hover {
  transform: scale(1.02);
}

.user-label {
  font-size: 14px;
  color: #666;
}

.user-nickname {
  font-size: 15px;
  font-weight: 600;
  color: #8B4513;
}

.nickname-input {
  border: none;
  outline: none;
  font-size: 15px;
  font-weight: 600;
  color: #8B4513;
  width: 120px;
  text-align: center;
  background: transparent;
}

.edit-hint {
  font-size: 12px;
}
</style>
