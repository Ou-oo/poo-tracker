const ACHIEVEMENTS = [
  {
    id: 'first_record',
    icon: '🎉',
    title: '首次记录',
    desc: '完成第一次便便记录',
    check: (records) => records.length >= 1
  },
  {
    id: 'ten_records',
    icon: '📝',
    title: '记录达人',
    desc: '累计记录10次',
    check: (records) => records.length >= 10
  },
  {
    id: 'fifty_records',
    icon: '🏅',
    title: '资深玩家',
    desc: '累计记录50次',
    check: (records) => records.length >= 50
  },
  {
    id: 'seven_day_streak',
    icon: '🔥',
    title: '一周全勤奖',
    desc: '连续7天每天都有记录',
    check: (records) => {
      const days = getRecordDates(records);
      return hasConsecutiveDays(days, 7);
    }
  },
  {
    id: 'three_day_normal',
    icon: '🌟',
    title: '黄金便便奖',
    desc: '连续3天轻松顺畅',
    check: (records) => {
      const dayMoods = getDailyMoods(records);
      return hasConsecutiveMoodDays(dayMoods, '正常', 3);
    }
  },
  {
    id: 'five_day_streak',
    icon: '💪',
    title: '五连击',
    desc: '连续5天每天都有记录',
    check: (records) => {
      const days = getRecordDates(records);
      return hasConsecutiveDays(days, 5);
    }
  },
  {
    id: 'one_day_three',
    icon: '⚡',
    title: '畅通无阻',
    desc: '一天内记录3次',
    check: (records) => {
      const counts = {};
      records.forEach(r => {
        const d = r.timestamp.split('T')[0];
        counts[d] = (counts[d] || 0) + 1;
      });
      return Object.values(counts).some(c => c >= 3);
    }
  },
  {
    id: 'gorgeous_flow',
    icon: '🌊',
    title: '一泻千里',
    desc: '记录"一泻千里"的畅快',
    check: (records) => records.some(r => r.mood === '顺利')
  },
  {
    id: 'triumphant_return',
    icon: '👑',
    title: '王者归来',
    desc: '记录"王者归来"的舒爽',
    check: (records) => records.some(r => r.mood === '舒适')
  },
  {
    id: 'week_twenty',
    icon: '🚀',
    title: '高产周',
    desc: '单周记录超过20次',
    check: (records) => {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      const weekCount = records.filter(r => new Date(r.timestamp) >= weekStart).length;
      return weekCount >= 20;
    }
  }
];

function getRecordDates(records) {
  const dates = new Set();
  records.forEach(r => {
    dates.add(r.timestamp.split('T')[0]);
  });
  return Array.from(dates).sort();
}

function getDailyMoods(records) {
  const dayMap = {};
  records.forEach(r => {
    const d = r.timestamp.split('T')[0];
    if (!dayMap[d]) {
      dayMap[d] = [];
    }
    dayMap[d].push(r.mood);
  });
  return dayMap;
}

function hasConsecutiveDays(dates, streak) {
  if (dates.length < streak) return false;
  for (let i = 0; i <= dates.length - streak; i++) {
    let consecutive = 1;
    for (let j = 1; j < streak; j++) {
      const prev = new Date(dates[i + j - 1]);
      const curr = new Date(dates[i + j]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        consecutive++;
      } else {
        break;
      }
    }
    if (consecutive >= streak) return true;
  }
  return false;
}

function hasConsecutiveMoodDays(dayMoods, targetMood, streak) {
  const dates = Object.keys(dayMoods).sort();
  if (dates.length < streak) return false;
  for (let i = 0; i <= dates.length - streak; i++) {
    let consecutive = 1;
    for (let j = 1; j < streak; j++) {
      const prev = new Date(dates[i + j - 1]);
      const curr = new Date(dates[i + j]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      const hasMood = dayMoods[dates[i + j]].includes(targetMood);
      if (diff === 1 && hasMood) {
        consecutive++;
      } else {
        break;
      }
    }
    if (consecutive >= streak) return true;
  }
  return false;
}

export function computeAchievements(records) {
  const unlocked = [];
  ACHIEVEMENTS.forEach(a => {
    if (a.check(records)) {
      unlocked.push(a);
    }
  });
  return unlocked;
}

export function getNewAchievements(records, alreadyUnlockedIds) {
  const current = computeAchievements(records);
  const newOnes = current.filter(a => !alreadyUnlockedIds.has(a.id));
  return newOnes;
}

export { ACHIEVEMENTS };