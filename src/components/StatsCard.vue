<template>
  <div class="stats-card">
    <h3 class="card-title" v-if="isMine">📊 我的数据</h3>
    <div class="today-status" :class="statusClass">
      <div class="status-icon">{{ statusIcon }}</div>
      <div class="status-content">
        <div class="status-title">{{ statusTitle }}</div>
        <div class="status-desc">{{ statusDesc }}</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-value">{{ todayCount }}</div>
        <div class="stat-label">今日次数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ weekStats.totalCount }}</div>
        <div class="stat-label">本周总次数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ weekStats.avgPerDay }}</div>
        <div class="stat-label">日均次数</div>
      </div>
    </div>

    <div class="week-chart">
      <h4 class="chart-title">📊 近7天趋势 <span class="chart-hint">点击查看历史</span></h4>
      <div class="bars">
        <div v-for="(count, date) in weekStats.dailyCounts" :key="date" class="bar-wrapper" @click="$emit('select-date', date)">
          <div class="bar-container">
            <div
              class="bar"
              :class="{ 'bar-today': isToday(date), 'bar-normal': count >= 1 && count <= 3 && !isToday(date) }"
              :style="{ height: getBarHeight(count) + '%' }"
            ></div>
          </div>
          <div class="bar-count">{{ count }}</div>
          <div class="bar-label">{{ formatLabel(date) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { isNormal } from '../utils/storage';

const props = defineProps({
  todayCount: {
    type: Number,
    default: 0
  },
  weekStats: {
    type: Object,
    default: () => ({
      dailyCounts: {},
      totalCount: 0,
      avgPerDay: '0.0',
      daysTracked: 0
    })
  },
  isMine: {
    type: Boolean,
    default: true
  }
});

defineEmits(['select-date']);

const today = new Date().toISOString().split('T')[0];

const statusClass = computed(() => {
  const count = props.todayCount;
  if (count === 0) return 'status-pending';
  if (isNormal(count)) return 'status-normal';
  return 'status-warning';
});

const statusIcon = computed(() => {
  const count = props.todayCount;
  if (count === 0) return '⏰';
  if (count >= 1 && count <= 3) return '✅';
  return '⚠️';
});

const statusTitle = computed(() => {
  const count = props.todayCount;
  if (count === 0) return '还没有记录';
  if (count >= 1 && count <= 3) return '排便正常';
  if (count < 1) return '排便偏少';
  return '排便偏多';
});

const statusDesc = computed(() => {
  const count = props.todayCount;
  if (count === 0) return '建议今天至少记录一次';
  if (count >= 1 && count <= 3) return '继续保持良好的习惯！';
  if (count < 1) return '注意多喝水，多吃蔬菜水果';
  return '注意饮食清淡，观察身体状况';
});

function isToday(date) {
  return date === today;
}

function getBarHeight(count) {
  const maxCount = Math.max(...Object.values(props.weekStats.dailyCounts), 3);
  return (count / maxCount) * 100;
}

function formatLabel(date) {
  const d = new Date(date);
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  return dayNames[d.getDay()];
}
</script>

<style scoped>
.stats-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.today-status {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.status-pending {
  background: #fff3e0;
}

.status-normal {
  background: #e8f5e9;
}

.status-warning {
  background: #ffebee;
}

.status-icon {
  font-size: 36px;
}

.status-content {
  flex: 1;
}

.status-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.status-desc {
  font-size: 13px;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-item {
  text-align: center;
  padding: 16px 8px;
  background: #f8f8f8;
  border-radius: 12px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #8B4513;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.chart-title {
  margin: 0 0 16px 0;
  font-size: 15px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-hint {
  font-size: 11px;
  color: #aaa;
  font-weight: normal;
}

.bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  height: 120px;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.bar-wrapper:hover {
  transform: translateY(-2px);
}

.bar-wrapper:hover .bar-label {
  color: #8B4513;
}

.bar-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 70%;
  min-height: 4px;
  background: #ddd;
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
}

.bar-normal {
  background: #4caf50;
}

.bar-today {
  background: #8B4513;
}

.bar-count {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-top: 4px;
}

.bar-label {
  font-size: 11px;
  color: #999;
}
</style>
