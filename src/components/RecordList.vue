<template>
  <div class="record-list">
    <h3 class="list-title">{{ title }}</h3>
    <div v-if="records.length === 0" class="empty-state">
      <span class="empty-icon">😐</span>
      <p>还没有记录哦</p>
      <p v-if="title === '📋 今日记录'" class="empty-hint">点击上方按钮记录第一次吧</p>
    </div>
    <template v-else>
      <ul class="records">
        <li v-for="record in displayedRecords" :key="record.id" class="record-item">
          <div class="record-info">
            <div class="record-meta">
              <span class="record-time">{{ formatTime(record.timestamp) }}</span>
              <span v-if="record.mood" class="record-mood" :class="'mood-' + getMoodClass(record.mood)">{{ getMoodLabel(record.mood) }}</span>
              <span v-if="showNickname && record.nickname" class="record-user">{{ record.nickname }}</span>
            </div>
            <span v-if="record.note" class="record-note">{{ record.note }}</span>
          </div>
          <button v-if="showDelete" class="delete-btn" @click="handleDelete(record.id)" title="删除">
            ✕
          </button>
        </li>
      </ul>
      <button v-if="records.length > 10" class="toggle-more-btn" @click="collapsed = !collapsed">
        {{ collapsed ? `展开更多（共${records.length}条）` : '收起' }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

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
  },
  title: {
    type: String,
    default: '📋 今日记录'
  },
  showDate: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['delete']);

const collapsed = ref(true);

const displayedRecords = computed(() => {
  if (collapsed.value && props.records.length > 10) {
    return props.records.slice(0, 10);
  }
  return props.records;
});

function formatTime(timestamp) {
  const date = new Date(timestamp);
  if (props.showDate) {
    return `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }
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

const moodMap = {
  '顺利': { label: '🌊 一泻千里', cls: 'good' },
  '正常': { label: '😊 轻松顺畅', cls: 'good' },
  '偏多': { label: '🍽️ 意犹未尽', cls: 'ok' },
  '费力': { label: '💪 费了老大劲', cls: 'warn' },
  '便秘': { label: '🔥 艰难困苦', cls: 'bad' },
  '腹泻': { label: '💦 一泻千里止不住', cls: 'bad' },
  '舒适': { label: '👑 王者归来', cls: 'good' },
  '奇怪': { label: '🤔 形状奇怪', cls: 'warn' }
};

function getMoodLabel(mood) {
  return moodMap[mood]?.label || mood;
}

function getMoodClass(mood) {
  return moodMap[mood]?.cls || 'ok';
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

.record-mood {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.record-mood.mood-good {
  color: #2e7d32;
  background: #e8f5e9;
}

.record-mood.mood-ok {
  color: #1565c0;
  background: #e3f2fd;
}

.record-mood.mood-warn {
  color: #e65100;
  background: #fff3e0;
}

.record-mood.mood-bad {
  color: #c62828;
  background: #ffebee;
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

.toggle-more-btn {
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  border: none;
  background: #fff3e0;
  color: #8B4513;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
}

.toggle-more-btn:hover {
  background: #ffe0b2;
}
</style>
