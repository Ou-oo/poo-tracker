<script setup>
import { ref, onMounted, computed } from 'vue';
import QuickRecord from './components/QuickRecord.vue';
import RecordList from './components/RecordList.vue';
import StatsCard from './components/StatsCard.vue';
import UserHeader from './components/UserHeader.vue';
import AllUsersStats from './components/AllUsersStats.vue';
import { getTodayRecords, getWeekStats, deleteRecord, getAllUserStats } from './utils/storage';
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
const viewMode = ref('mine');
const initialLoading = ref(true);
const refreshing = ref(false);

const myTodayRecords = computed(() => 
  todayRecords.value.filter(r => r.nickname === currentNickname.value)
);

const myWeekStats = computed(() => {
  if (viewMode.value === 'all') {
    return weekStats.value;
  }
  const stats = { ...weekStats.value };
  let myTotal = 0;
  const myDailyCounts = {};
  Object.entries(weekStats.value.dailyCounts).forEach(([date, count]) => {
    const myCount = todayRecords.value.filter(r => 
      r.nickname === currentNickname.value && r.timestamp.split('T')[0] === date
    ).length;
    myDailyCounts[date] = myCount;
    myTotal += myCount;
  });
  stats.dailyCounts = myDailyCounts;
  stats.totalCount = myTotal;
  const activeDays = Object.values(myDailyCounts).filter(v => v > 0).length || 1;
  stats.avgPerDay = (myTotal / activeDays).toFixed(1);
  return stats;
});

async function loadData() {
  currentNickname.value = ensureNickname();
  try {
    const [today, week, allUsers] = await Promise.all([
      getTodayRecords(),
      getWeekStats(),
      getAllUserStats()
    ]);
    todayRecords.value = today;
    weekStats.value = week;
    allUserStats.value = allUsers;
  } catch (e) {
    console.error('加载数据失败:', e);
  }
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
  await loadData();
  initialLoading.value = false;
});
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">💩 便便日记</h1>
      <p class="app-subtitle">关注肠道健康，从记录开始</p>
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
</style>
