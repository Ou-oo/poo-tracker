<template>
  <div class="all-users-stats">
    <h3 class="section-title">👥 好友排行榜</h3>
    <div v-if="userStats.length === 0" class="empty">
      <p>暂无其他用户数据</p>
      <p class="hint">快邀请朋友一起来记录吧！</p>
    </div>
    <div v-else class="user-cards">
      <div 
        v-for="user in sortedUsers" 
        :key="user.nickname" 
        class="user-card"
        :class="{ 'is-me': user.nickname === currentNickname }"
      >
        <div class="user-card-header">
          <span class="user-name">{{ user.nickname }}</span>
          <span v-if="user.nickname === currentNickname" class="me-badge">我</span>
        </div>
        <div class="user-stats-row">
          <div class="stat-block">
            <span class="stat-num" :class="getStatusClass(user.todayCount)">{{ user.todayCount }}</span>
            <span class="stat-label">今日</span>
          </div>
          <div class="stat-block">
            <span class="stat-num">{{ user.totalCount }}</span>
            <span class="stat-label">本周</span>
          </div>
          <div class="stat-block">
            <span class="stat-dot" :class="getStatusDotClass(user.todayCount)"></span>
            <span class="stat-label">{{ getStatusText(user.todayCount) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { isNormal } from '../utils/storage';

const props = defineProps({
  userStats: {
    type: Array,
    default: () => []
  },
  currentNickname: {
    type: String,
    default: ''
  }
});

const sortedUsers = computed(() => {
  return [...props.userStats].sort((a, b) => {
    if (a.nickname === props.currentNickname) return -1;
    if (b.nickname === props.currentNickname) return 1;
    return b.totalCount - a.totalCount;
  });
});

function getStatusClass(count) {
  if (count === 0) return 'status-pending';
  if (isNormal(count)) return 'status-normal';
  return 'status-warning';
}

function getStatusDotClass(count) {
  if (count === 0) return 'dot-pending';
  if (isNormal(count)) return 'dot-normal';
  return 'dot-warning';
}

function getStatusText(count) {
  if (count === 0) return '待记录';
  if (isNormal(count)) return '正常 ✅';
  return count < 1 ? '偏少 ⚠️' : '偏多 ⚠️';
}
</script>

<style scoped>
.all-users-stats {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.empty {
  text-align: center;
  padding: 30px 20px;
  color: #999;
}

.hint {
  font-size: 13px;
  margin-top: 4px;
}

.user-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  padding: 14px 16px;
  background: #f8f8f8;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.user-card.is-me {
  background: #fff8e1;
  border-color: #8B4513;
}

.user-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.user-name {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.me-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: #8B4513;
  color: white;
  border-radius: 10px;
}

.user-stats-row {
  display: flex;
  gap: 20px;
}

.stat-block {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.stat-num.status-pending {
  color: #999;
}

.stat-num.status-normal {
  color: #4caf50;
}

.stat-num.status-warning {
  color: #ff9800;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-pending {
  background: #ccc;
}

.dot-normal {
  background: #4caf50;
}

.dot-warning {
  background: #ff9800;
}
</style>
