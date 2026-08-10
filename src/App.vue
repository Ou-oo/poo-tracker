<script setup>
import { ref, onMounted, computed } from 'vue';
import QuickRecord from './components/QuickRecord.vue';
import RecordList from './components/RecordList.vue';
import StatsCard from './components/StatsCard.vue';
import UserHeader from './components/UserHeader.vue';
import AllUsersStats from './components/AllUsersStats.vue';
import { getTodayRecords, getWeekStats, deleteRecord, getAllUserStats, getRecordsByDate, fetchAllRecords, deleteTestRecords, getNotifications, getUnreadCount, markAllRead } from './utils/storage';
import { ensureNickname, getNickname, setNickname } from './utils/user';
import { computeAchievements, getNewAchievements, ACHIEVEMENTS } from './utils/achievements';

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
const myAllRecords = ref([]);
const allRecordsRaw = ref([]);
const unlockedAchievements = ref([]);
const achievementToast = ref(null);
const showAchievementsModal = ref(false);
const alreadyUnlockedIds = new Set();
const selectedFriend = ref(null);
const friendRecords = ref([]);
const cleaningTest = ref(false);
const unreadCount = ref(0);
const showNotifications = ref(false);
const notifications = ref([]);
const notificationToast = ref(null);

const funFacts = [
  '热知识：每天排便1-3次都是正常的，不必焦虑',
  '热知识：大便在肠道里约停留12-48小时',
  '热知识：多喝水能有效预防便秘，每天至少8杯水',
  '热知识：膳食纤维能让大便更通畅，多吃蔬菜水果',
  '热知识：蹲便姿势比坐便更符合人体工学',
  '热知识：大便颜色异常可能是健康预警，要留意',
  '热知识：肠道是人体第二大脑，健康肠道影响情绪',
  '热知识：每天约有100万亿个细菌在肠道内帮你工作',
  '热知识：运动能促进肠道蠕动，帮助顺利排便',
  '热知识：憋便会导致毒素重吸收，有便意别忍',
  '热知识：便便的形状反映肠道健康，香蕉形最佳',
  '热知识：吃益生菌可以改善肠道菌群平衡',
  '热知识：腹部按摩能缓解便秘，顺时针方向轻柔打圈',
  '热知识：乳糖不耐受的人喝牛奶可能会导致腹泻',
  '热知识：排便时间最好在早上起床后或早餐后'
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

const isTestNickname = (name) => /^user/i.test(name);

const filteredUserStats = computed(() => {
  return allUserStats.value.filter(u => !isTestNickname(u.nickname));
});

const hasTestRecords = computed(() => {
  return allUserStats.value.some(u => isTestNickname(u.nickname));
});

async function loadData() {
  currentNickname.value = ensureNickname();
  try {
    const [today, week, allUsers, myWeek, allRecords] = await Promise.all([
      getTodayRecords(),
      getWeekStats(),
      getAllUserStats(),
      getWeekStats(currentNickname.value),
      fetchAllRecords()
    ]);
    todayRecords.value = today;
    weekStats.value = week;
    allUserStats.value = allUsers;
    myWeekStatsData.value = myWeek;

    myAllRecords.value = allRecords.filter(r => r.nickname === currentNickname.value);
    allRecordsRaw.value = allRecords;
    computeMyAchievements();
  } catch (e) {
    console.error('加载数据失败:', e);
  }
}

function computeMyAchievements() {
  const current = computeAchievements(myAllRecords.value);
  const currentIds = new Set(current.map(a => a.id));

  const newAchievements = getNewAchievements(myAllRecords.value, alreadyUnlockedIds);
  if (newAchievements.length > 0 && alreadyUnlockedIds.size > 0) {
    showAchievementToast(newAchievements);
  }

  unlockedAchievements.value = current;
  alreadyUnlockedIds.clear();
  currentIds.forEach(id => alreadyUnlockedIds.add(id));
}

function showAchievementToast(newAchievements) {
  achievementToast.value = {
    items: newAchievements,
    show: true
  };
  setTimeout(() => {
    achievementToast.value.show = false;
    setTimeout(() => {
      achievementToast.value = null;
    }, 400);
  }, 3000);
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

function handleSelectFriend(nickname) {
  selectedFriend.value = nickname;
  friendRecords.value = allRecordsRaw.value
    .filter(r => r.nickname === nickname)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function closeFriendModal() {
  selectedFriend.value = null;
  friendRecords.value = [];
}

async function handleCleanTestRecords() {
  if (!confirm('确定要删除所有 user_ 开头的测试数据吗？此操作不可撤销。')) return;
  cleaningTest.value = true;
  const ok = await deleteTestRecords();
  if (ok) {
    await loadData();
  } else {
    alert('删除失败，请检查网络或 Supabase 连接');
  }
  cleaningTest.value = false;
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
  await loadNotifications();
  // 每30秒轮询新通知
  setInterval(loadNotifications, 30000);
});

async function loadNotifications() {
  const nickname = getNickname();
  if (!nickname) return;
  const [count, list] = await Promise.all([
    getUnreadCount(nickname),
    getNotifications(nickname)
  ]);
  // 检测新通知（之前没有的）
  const prevIds = new Set(notifications.value.map(n => n.id));
  const newOnes = list.filter(n => !prevIds.has(n.id) && !n.isRead);
  unreadCount.value = count;
  notifications.value = list;
  // 弹窗提示新通知
  if (newOnes.length > 0 && prevIds.size > 0) {
    showNotificationToast(newOnes[0]);
  }
}

function showNotificationToast(n) {
  const typeMap = {
    like: { icon: '❤️', text: '点赞了你的记录' },
    favorite: { icon: '⭐', text: '收藏了你的记录' },
    comment: { icon: '💬', text: '评论了你的记录' },
    question: { icon: '❓', text: '对你的记录有疑问' }
  };
  const info = typeMap[n.type] || { icon: '🔔', text: '给你发了一条通知' };
  notificationToast.value = {
    from: n.fromUser,
    text: info.text,
    icon: info.icon,
    content: n.content,
    show: true
  };
  setTimeout(() => {
    if (notificationToast.value) notificationToast.value.show = false;
    setTimeout(() => { notificationToast.value = null; }, 400);
  }, 4000);
}

async function handleOpenNotifications() {
  showNotifications.value = true;
  const nickname = getNickname();
  if (nickname && unreadCount.value > 0) {
    await markAllRead(nickname);
    unreadCount.value = 0;
  }
}

function closeNotifications() {
  showNotifications.value = false;
}

function onInteracted() {
  // 互动后刷新通知
  loadNotifications();
}

function formatNotificationTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-row">
        <h1 class="app-title">💩 便便日记</h1>
        <button class="notification-bell" @click="handleOpenNotifications" title="通知">
          🔔
          <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </button>
      </div>
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

        <div class="achievements-section" @click="showAchievementsModal = true">
          <div class="achievements-header">
            <span class="achievements-title">🏆 通便成就</span>
            <span class="achievements-count">{{ unlockedAchievements.length }}/{{ ACHIEVEMENTS.length }}</span>
          </div>
          <div class="achievements-preview">
            <template v-if="unlockedAchievements.length > 0">
              <div v-for="a in unlockedAchievements.slice(0, 4)" :key="a.id" class="achievement-badge" :title="a.desc">
                <span class="badge-icon">{{ a.icon }}</span>
              </div>
              <div v-if="unlockedAchievements.length > 4" class="achievement-badge more">
                +{{ unlockedAchievements.length - 4 }}
              </div>
            </template>
            <span v-else class="no-achievement">开始记录解锁成就 →</span>
          </div>
        </div>

        <RecordList 
          :records="myTodayRecords" 
          @delete="handleDelete" 
          :show-delete="true"
        />
      </template>

      <template v-else>
        <AllUsersStats :user-stats="filteredUserStats" :current-nickname="currentNickname" @select-user="handleSelectFriend" />
        <button v-if="hasTestRecords" class="clean-test-btn" @click="handleCleanTestRecords" :disabled="cleaningTest">
          {{ cleaningTest ? '清理中...' : '🗑️ 清理测试数据' }}
        </button>
        <RecordList
          :records="todayRecords.filter(r => !isTestNickname(r.nickname))"
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

    <div v-if="achievementToast" class="achievement-toast" :class="{ show: achievementToast.show }">
      <div class="toast-header">
        <span class="toast-icon">🎊</span>
        <span class="toast-title">恭喜解锁新成就！</span>
      </div>
      <div class="toast-items">
        <div v-for="item in achievementToast.items" :key="item.id" class="toast-item">
          <span class="toast-big-icon">{{ item.icon }}</span>
          <div class="toast-item-info">
            <div class="toast-item-title">{{ item.title }}</div>
            <div class="toast-item-desc">{{ item.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAchievementsModal" class="achievements-modal-overlay" @click.self="showAchievementsModal = false">
      <div class="achievements-modal">
        <div class="achievements-modal-header">
          <h3>🏆 通便成就</h3>
          <button class="history-modal-close" @click="showAchievementsModal = false">✕</button>
        </div>
        <div class="achievements-modal-body">
          <div v-for="a in ACHIEVEMENTS" :key="a.id" class="achievement-item" :class="{ unlocked: unlockedAchievements.some(u => u.id === a.id) }">
            <div class="achievement-item-icon">{{ unlockedAchievements.some(u => u.id === a.id) ? a.icon : '🔒' }}</div>
            <div class="achievement-item-info">
              <div class="achievement-item-title">{{ a.title }}</div>
              <div class="achievement-item-desc">{{ a.desc }}</div>
            </div>
            <div class="achievement-item-status">{{ unlockedAchievements.some(u => u.id === a.id) ? '已解锁' : '未解锁' }}</div>
          </div>
        </div>
      </div>
    </div>

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

    <div v-if="selectedFriend" class="history-modal-overlay" @click.self="closeFriendModal">
      <div class="history-modal">
        <div class="history-modal-header">
          <h3 class="history-modal-title">👥 {{ selectedFriend }} 的记录</h3>
          <button class="history-modal-close" @click="closeFriendModal">✕</button>
        </div>
        <RecordList
          :records="friendRecords"
          :show-delete="false"
          :show-nickname="false"
          :show-date="true"
          :show-interactions="true"
          :title="`📋 近期记录（共${friendRecords.length}条）`"
          @interacted="onInteracted"
        />
      </div>
    </div>

    <!-- 通知列表弹窗 -->
    <div v-if="showNotifications" class="history-modal-overlay" @click.self="closeNotifications">
      <div class="history-modal">
        <div class="history-modal-header">
          <h3 class="history-modal-title">🔔 通知中心</h3>
          <button class="history-modal-close" @click="closeNotifications">✕</button>
        </div>
        <div class="notifications-list">
          <div v-if="notifications.length === 0" class="empty-notifications">
            <span style="font-size: 36px;">🔕</span>
            <p>暂无通知</p>
          </div>
          <div v-for="n in notifications" :key="n.id" class="notification-item" :class="{ unread: !n.isRead }">
            <span class="notification-icon">{{ { like: '❤️', favorite: '⭐', comment: '💬', question: '❓' }[n.type] || '🔔' }}</span>
            <div class="notification-content">
              <div class="notification-text">
                <span class="notification-from">{{ n.fromUser }}</span>
                {{ { like: '点赞了你的记录', favorite: '收藏了你的记录', comment: '评论了你的记录', question: '对你的记录有疑问' }[n.type] || '给你发了一条通知' }}
              </div>
              <div v-if="n.content" class="notification-comment">"{{ n.content }}"</div>
              <div class="notification-time">{{ formatNotificationTime(n.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知即时弹窗 -->
    <div v-if="notificationToast" class="notification-toast" :class="{ show: notificationToast.show }">
      <span class="notification-toast-icon">{{ notificationToast.icon }}</span>
      <div class="notification-toast-body">
        <div class="notification-toast-text">
          <strong>{{ notificationToast.from }}</strong> {{ notificationToast.text }}
        </div>
        <div v-if="notificationToast.content" class="notification-toast-content">"{{ notificationToast.content }}"</div>
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

.header-row {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.app-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #333;
}

.notification-bell {
  position: absolute;
  right: 0;
  top: 0;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  position: relative;
  padding: 4px;
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -4px;
  background: #ff4444;
  color: white;
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  font-weight: 600;
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

.clean-test-btn {
  padding: 8px 16px;
  border: 1px dashed #ccc;
  background: white;
  color: #888;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  align-self: center;
}

.clean-test-btn:hover:not(:disabled) {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.clean-test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.achievements-section {
  background: white;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.achievements-section:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.achievements-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.achievements-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.achievements-count {
  font-size: 13px;
  color: #8B4513;
  font-weight: 600;
}

.achievements-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.achievement-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(145deg, #fff3e0, #ffe0b2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 2px 6px rgba(139, 69, 19, 0.15);
}

.achievement-badge.more {
  background: #f5f5f5;
  font-size: 12px;
  color: #888;
  font-weight: 600;
}

.no-achievement {
  font-size: 13px;
  color: #aaa;
}

.achievement-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(-20px);
  background: white;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  z-index: 2000;
  min-width: 280px;
  max-width: 340px;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  border: 2px solid #ffd54f;
}

.achievement-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.toast-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.toast-icon {
  font-size: 20px;
}

.toast-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.toast-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toast-big-icon {
  font-size: 32px;
}

.toast-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.toast-item-desc {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.achievements-modal-overlay {
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

.achievements-modal {
  background: white;
  border-radius: 16px;
  padding: 20px;
  max-width: 440px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.achievements-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.achievements-modal-header h3 {
  margin: 0;
  font-size: 17px;
  color: #333;
}

.achievements-modal-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 12px;
  background: #f8f8f8;
  opacity: 0.6;
  transition: all 0.2s;
}

.achievement-item.unlocked {
  background: linear-gradient(135deg, #fff8e1, #fff3e0);
  opacity: 1;
  border: 1px solid #ffe0b2;
}

.achievement-item-icon {
  font-size: 32px;
  width: 44px;
  text-align: center;
}

.achievement-item.unlocked .achievement-item-icon {
  filter: drop-shadow(0 2px 4px rgba(255, 193, 7, 0.3));
}

.achievement-item-info {
  flex: 1;
}

.achievement-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.achievement-item-desc {
  font-size: 12px;
  color: #888;
}

.achievement-item-status {
  font-size: 12px;
  color: #aaa;
  font-weight: 500;
}

.achievement-item.unlocked .achievement-item-status {
  color: #8B4513;
  font-weight: 600;
}

/* 通知列表样式 */
.notifications-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px 0;
}

.empty-notifications {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.notification-item {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  align-items: flex-start;
}

.notification-item.unread {
  background: #fff8e1;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-text {
  font-size: 14px;
  color: #333;
}

.notification-from {
  font-weight: 600;
  color: #8B4513;
}

.notification-comment {
  font-size: 13px;
  color: #666;
  background: #f5f5f5;
  border-radius: 6px;
  padding: 4px 8px;
  margin-top: 4px;
}

.notification-time {
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
}

/* 通知即时弹窗样式 */
.notification-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 12px 16px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  z-index: 3000;
  max-width: 320px;
  transform: translateX(400px);
  opacity: 0;
  transition: all 0.4s ease;
}

.notification-toast.show {
  transform: translateX(0);
  opacity: 1;
}

.notification-toast-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notification-toast-body {
  flex: 1;
}

.notification-toast-text {
  font-size: 14px;
  color: #333;
}

.notification-toast-content {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
  background: #f5f5f5;
  border-radius: 6px;
  padding: 4px 8px;
}
</style>
