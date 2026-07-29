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
const loading = ref(true);

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

async function refreshData() {
  loading.value = true;
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
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id) {
  await deleteRecord(id);
  await refreshData();
}

function handleNicknameChange(newName) {
  setNickname(newName);
  currentNickname.value = newName;
  refreshData();
}

function toggleView() {
  viewMode.value = viewMode.value === 'mine' ? 'all' : 'mine';
}

onMounted(() => {
  refreshData();
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

    <main v-if="!loading" class="app-main">
      <QuickRecord @recorded="refreshData" />

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
    </main>

    <div v-else class="loading">
      <p>加载中...</p>
    </div>

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

.app-footer {
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: #aaa;
}
</style>
