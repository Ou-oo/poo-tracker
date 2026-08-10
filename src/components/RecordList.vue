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
        <li v-for="record in displayedRecords" :key="record.id" class="record-item" :class="{ 'has-interactions': showInteractions }">
          <div class="record-info">
            <div class="record-meta">
              <span class="record-time">{{ formatTime(record.timestamp) }}</span>
              <span v-if="record.mood" class="record-mood" :class="'mood-' + getMoodClass(record.mood)">{{ getMoodLabel(record.mood) }}</span>
              <span v-if="showNickname && record.nickname" class="record-user">{{ record.nickname }}</span>
            </div>
            <span v-if="record.note" class="record-note">{{ record.note }}</span>
            <!-- 互动按钮 -->
            <div v-if="showInteractions" class="interaction-bar">
              <button class="interaction-btn" :class="{ active: hasInteracted(record.id, 'like') }" @click="handleInteraction(record, 'like')" title="点赞">
                {{ hasInteracted(record.id, 'like') ? '❤️' : '🤍' }} {{ getCount(record.id, 'like') }}
              </button>
              <button class="interaction-btn" :class="{ active: hasInteracted(record.id, 'favorite') }" @click="handleInteraction(record, 'favorite')" title="收藏">
                {{ hasInteracted(record.id, 'favorite') ? '⭐' : '☆' }} {{ getCount(record.id, 'favorite') }}
              </button>
              <button class="interaction-btn" @click="toggleComment(record.id)" title="评论">
                💬 {{ getCount(record.id, 'comment') }}
              </button>
              <button class="interaction-btn" @click="handleInteraction(record, 'question')" title="疑问">
                ❓ {{ getCount(record.id, 'question') }}
              </button>
            </div>
            <!-- 评论展开区 -->
            <div v-if="showInteractions && commentingId === record.id" class="comment-area">
              <input
                v-model="commentText"
                class="comment-input"
                placeholder="说点什么..."
                @keyup.enter="submitComment(record)"
                maxlength="100"
              />
              <button class="comment-submit" @click="submitComment(record)">发送</button>
            </div>
            <!-- 已有评论列表 -->
            <div v-if="showInteractions && getComments(record.id).length > 0" class="comment-list">
              <div v-for="c in getComments(record.id)" :key="c.id" class="comment-item">
                <span class="comment-user">{{ c.fromUser }}</span>
                <span class="comment-content">{{ c.content }}</span>
              </div>
            </div>
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
import { ref, computed, watch } from 'vue';
import { addInteraction, getInteractionsForRecord } from '../utils/storage';
import { ensureNickname } from '../utils/user';

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
  },
  showInteractions: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['delete', 'interacted']);

const collapsed = ref(true);
const interactionsMap = ref({});
const commentingId = ref(null);
const commentText = ref('');
const myNickname = ensureNickname();

const displayedRecords = computed(() => {
  if (collapsed.value && props.records.length > 10) {
    return props.records.slice(0, 10);
  }
  return props.records;
});

// 加载互动数据
async function loadInteractions(recordIds) {
  for (const id of recordIds) {
    if (!interactionsMap.value[id]) {
      const data = await getInteractionsForRecord(id);
      interactionsMap.value[id] = data;
    }
  }
}

watch(() => props.records, (newRecords) => {
  if (props.showInteractions && newRecords.length > 0) {
    interactionsMap.value = {};
    loadInteractions(newRecords.map(r => r.id));
  }
}, { immediate: true });

function hasInteracted(recordId, type) {
  const list = interactionsMap.value[recordId] || [];
  return list.some(i => i.fromUser === myNickname && i.type === type);
}

function getCount(recordId, type) {
  const list = interactionsMap.value[recordId] || [];
  const filtered = list.filter(i => i.type === type);
  return filtered.length || '';
}

function getComments(recordId) {
  const list = interactionsMap.value[recordId] || [];
  return list.filter(i => i.type === 'comment' && i.content);
}

async function handleInteraction(record, type) {
  // 点赞/收藏可以取消
  if (hasInteracted(record.id, type)) {
    return; // 已操作过，不再重复
  }
  const result = await addInteraction(record.id, record.nickname, type);
  if (result) {
    if (!interactionsMap.value[record.id]) {
      interactionsMap.value[record.id] = [];
    }
    interactionsMap.value[record.id].unshift(result);
    emit('interacted', { record, type, result });
  }
}

function toggleComment(recordId) {
  if (commentingId.value === recordId) {
    commentingId.value = null;
  } else {
    commentingId.value = recordId;
    commentText.value = '';
  }
}

async function submitComment(record) {
  if (!commentText.value.trim()) return;
  const result = await addInteraction(record.id, record.nickname, 'comment', commentText.value.trim());
  if (result) {
    if (!interactionsMap.value[record.id]) {
      interactionsMap.value[record.id] = [];
    }
    interactionsMap.value[record.id].unshift(result);
    emit('interacted', { record, type: 'comment', result });
  }
  commentText.value = '';
  commentingId.value = null;
}

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

/* 互动功能样式 */
.record-item.has-interactions {
  flex-direction: column;
  align-items: stretch;
}

.interaction-bar {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.interaction-btn {
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 16px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.interaction-btn:hover {
  border-color: #8B4513;
  color: #8B4513;
}

.interaction-btn.active {
  background: #fff3e0;
  border-color: #8B4513;
  color: #8B4513;
}

.comment-area {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.comment-input {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 13px;
  outline: none;
}

.comment-input:focus {
  border-color: #8B4513;
}

.comment-submit {
  border: none;
  background: #8B4513;
  color: white;
  border-radius: 8px;
  padding: 5px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.comment-submit:hover {
  background: #A0522D;
}

.comment-list {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-item {
  font-size: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 4px 10px;
}

.comment-user {
  font-weight: 600;
  color: #8B4513;
  margin-right: 6px;
}

.comment-content {
  color: #555;
}
</style>
