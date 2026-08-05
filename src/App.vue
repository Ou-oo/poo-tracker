<script setup>
import { ref, onMounted, computed } from 'vue';
import QuickRecord from './components/QuickRecord.vue';
import RecordList from './components/RecordList.vue';
import StatsCard from './components/StatsCard.vue';
import UserHeader from './components/UserHeader.vue';
import AllUsersStats from './components/AllUsersStats.vue';
import { getTodayRecords, getWeekStats, deleteRecord, getAllUserStats, getRecordsByDate } from './utils/storage';
import { ensureNickname, getNickname, setNickname } from './utils/user';

const currentNickname = ref('');
const todayRecords = ref([]);
const weekStats = ref({
  dailyCounts: {},
  totalCount: 0,
  avgPerDay: '0.0',
  daysTracked: 0
});
const allUserStats = ref([]);
const myWeekStatsData = ref({
  dailyCounts: {},
  totalCount: 0,
  avgPerDay: '0.0',
  daysTracked: 0
});
const viewMode = ref('mine');
const initialLoading = ref(true);
const refreshing = ref(false);
const selectedDate = ref(null);
const selectedDateRecords = ref([]);
const loadingHistory = ref(false);

const funFacts = [
  '💡 每天排便1-3次都是正常的，不必焦虑',
  '💡 大便在肠道里约停留12-48小时',
  '💡 多喝水能有效预防便秘，每天至少8杯水',
  '💡 膳食纤维能让大便更通畅，多吃蔬菜水果',
  '💡 蹲便姿势比坐便更符合人体工学',
  '💡 大便颜色异常可能是健康预警，要留意',
  '💡 肠道是人体第二大脑，健康肠道影响情绪',
  '💡 每天约有100万亿个细菌在肠道内帮你工作',
  '💡 运动能促进肠道蠕动，帮助顺利排便',
  '💡 憋便会导致毒素重吸收，有便意别忍',
  '💡 便便的形状反映肠道健康，香蕉形最佳',
  '💡 吃益生菌可以改善肠道菌群平衡',
  '💡 腹部按摩能缓解便秘，顺时针方向轻柔打圈',
  '💡 乳糖不耐受的人喝牛奶可能会导致腹泻',
  '💡 排便时间最好在早上起床后或早餐后'
];

const currentFunFact = ref('');

function pickRandomFunFact() {
  const idx = Math.floor(Math.random() * funFacts.length);
  currentFunFact.value = funFacts[idx];
}

const myTodayRecords = computed(() => 
  todayRecords.value.filter(r => r.nickname === currentNickname.value)
);

const myWeekStats = computed(() => {
  if (viewMode.value === 'all') {
    return weekStats.value;
  }
  return myWeekStatsData.value;
});

async function loadData() {
  currentNickname.value = ensureNickname();
  try {
    const [today, week, allUsers, myWeek] = await Promise.all([
      getTodayRecords(),
      getWeekStats(),
      getAllUserStats(),
      getWeekStats(currentNickname.value)
    ]);
    todayRecords.value = today;
    weekStats.value = week;
    allUserStats.value = allUsers;
    myWeekStatsData.value = myWeek;
  } catch (e) {
    console.error('加载数据失败:', e);
  }
}

async function handleSelectDate(date) {
  selectedDate.value = date;
  loadingHistory.value = true;
  try {
    selectedDateRecords.value = await getRecordsByDate(date, currentNickname.value);
  } catch (e) {
    console.error('加载历史记录失败:', e);
    selectedDateRecords.value = [];
  }
  loadingHistory.value = false;
}

function closeHistoryModal() {
  selectedDate.value = null;
  selectedDateRecords.value = [];
}

function formatHistoryDate(dateStr) {
  const d = new Date(dateStr);
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${dayNames[d.getDay()]}`;
}

async function handleRecorded() {
  refreshing.value = true;
  await loadData();
  refreshing.value = false;
}

async function handleDelete(id) {
  refreshing.value = true;
  await deleteRecord(id);
  await loadData();
  refreshing.value = false;
}

function handleNicknameChange(newName) {
  setNickname(newName);
  currentNickname.value = newName;
  loadData();
}

function toggleView() {
  viewMode.value = viewMode.value === 'mine' ? 'all' : 'mine';
}

onMounted(async () => {
  pickRandomFunFact();
  await loadData();
  initialLoading.value = false;
});
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">💩 便便日记</h1>
      <p class="app-subtitle">{{ currentFunFact }}</p>
    </header>

    <UserHeader 
      :nickname="currentNickname" 
      @change="handleNicknameChange" 
    />

    <div v-if="initialLoading" class="loading">
      <p>加载中...</p>
    </div>

    <main v-else class="app-main">
      <QuickRecord @recorded="handleRecorded" :disabled="refreshing" />

      <div class="view-toggle" v-if="allUserStats.length > 0">
        <button 
          class="toggle-btn" 
          :class="{ active: viewMode === 'mine' }"
          @click="viewMode = 'mine'"
        >
          我的数据
        </button>
        <button 
          class="toggle-btn" 
          :class="{ active: viewMode === 'all' }"
          @click="viewMode = 'all'"
        >
          大家的
        </button>
      </div>

      <template v-if="viewMode === 'mine'">
        <StatsCard 
          :today-count="myTodayRecords.length" 
          :week-stats="myWeekStats" 
          :is-mine="true"
          @select-date="handleSelectDate"
        />
        <RecordList 
          :records="myTodayRecords" 
          @delete="handleDelete" 
          :show-delete="true"
        />
      </template>

      <template v-else>
        <AllUsersStats :user-stats="allUserStats" :current-nickname="currentNickname" />
        <RecordList 
          :records="todayRecords" 
          @delete="handleDelete" 
          :show-delete="false"
          :show-nickname="true"
        />
      </template>

      <div v-if="refreshing" class="refreshing-indicator">
        <span class="spinner"></span>
        <span>正在同步数据...</span>
      </div>
    </main>

    <footer class="app-footer">
      <p>数据保存在云端，可多人共享查看</p>
    </footer>

    <div v-if="selectedDate" class="history-modal-overlay" @click.self="closeHistoryModal">
      <div class="history-modal">
        <div class="history-modal-header">
          <h3 class="history-modal-title">📅 {{ formatHistoryDate(selectedDate) }}</h3>
          <button class="history-modal-close" @click="closeHistoryModal">✕</button>
        </div>
        <div v-if="loadingHistory" class="history-loading">
          <span class="spinner"></span>
          <span>加载中...</span>
        </div>
        <RecordList
          v-else
          :records="selectedDateRecords"
          :show-delete="false"
          :title="`📋 ${formatHistoryDate(selectedDate)} 的记录`"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff8e1 0%, #f5f5f5 30%);
}

.app-header {
  text-align: center;
  padding: 30px 20px 20px;
}

.app-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #333;
}

.app-subtitle {
  margin: 0;
  font-size: 14px;
  color: #888;
}

.app-main {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.view-toggle {
  display: flex;
  background: white;
  border-radius: 25px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.toggle-btn {
  flex: 1;
  padding: 10px 20px;
  border: none;
  background: transparent;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: #8B4513;
  color: white;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.refreshing-indicator {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(139, 69, 19, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 999;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.app-footer {
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: #aaa;
}

.history-modal-overlay {
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
}

.history-modal {
  background: white;
  border-radius: 16px;
  padding: 20px;
  max-width: 440px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: modalIn 0.2s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.history-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.history-modal-title {
  margin: 0;
  font-size: 17px;
  color: #333;
}

.history-modal-close {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: #f0f0f0;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.history-modal-close:hover {
  background: #e0e0e0;
}

.history-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.history-loading .spinner {
  border-color: rgba(139, 69, 19, 0.3);
  border-top-color: #8B4513;
}
</style>
