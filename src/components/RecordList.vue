<template>
  <div class="record-list">
    <h3 class="list-title">📋 今日记录</h3>
    <div v-if="records.length === 0" class="empty-state">
      <span class="empty-icon">😐</span>
      <p>今天还没有记录哦</p>
      <p class="empty-hint">点击上方按钮记录第一次吧</p>
    </div>
    <ul v-else class="records">
      <li v-for="record in records" :key="record.id" class="record-item">
        <div class="record-info">
          <div class="record-meta">
            <span class="record-time">{{ formatTime(record.timestamp) }}</span>
            <span v-if="showNickname && record.nickname" class="record-user">{{ record.nickname }}</span>
          </div>
          <span v-if="record.note" class="record-note">{{ record.note }}</span>
        </div>
        <button v-if="showDelete" class="delete-btn" @click="handleDelete(record.id)" title="删除">
          ✕
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  records: {
    type: Array,
    default: () => []
  },
  showDelete: {
    type: Boolean,
    default: true
  },
  showNickname: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['delete']);

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function handleDelete(id) {
  if (confirm('确定要删除这条记录吗？')) {
    emit('delete', id);
  }
}
</script>

<style scoped>
.record-list {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.list-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 30px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 13px;
  margin-top: 4px;
}

.records {
  list-style: none;
  padding: 0;
  margin: 0;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f8f8;
  border-radius: 10px;
  margin-bottom: 8px;
  transition: background 0.2s;
}

.record-item:hover {
  background: #f0f0f0;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.record-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.record-time {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.record-user {
  font-size: 12px;
  color: #8B4513;
  background: #fff3e0;
  padding: 2px 8px;
  border-radius: 10px;
}

.record-note {
  font-size: 13px;
  color: #666;
  background: #fff3e0;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  align-self: flex-start;
}

.delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ff6b6b;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: #ee5a5a;
}
</style>
