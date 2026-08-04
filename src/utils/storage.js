import { supabase, isSupabaseAvailable } from '../config/supabase';
import { ensureNickname } from './user';

const LOCAL_KEY = 'poo_records_local';

function getLocalRecords() {
  const data = localStorage.getItem(LOCAL_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalRecords(records) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(records));
}

export async function fetchAllRecords() {
  if (isSupabaseAvailable) {
    try {
      const { data, error } = await supabase
        .from('poo_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(r => ({
        id: r.id,
        timestamp: r.created_at,
        note: r.note || '',
        nickname: r.user_nickname
      }));
    } catch (e) {
      console.warn('Supabase 查询失败，使用本地存储:', e.message);
      return getLocalRecords().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  } else {
    return getLocalRecords().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

export async function addRecord(note = '') {
  const nickname = ensureNickname();
  if (isSupabaseAvailable) {
    try {
      const { data, error } = await supabase
        .from('poo_records')
        .insert([{ user_nickname: nickname, note }])
        .select();
      if (error) throw error;
      const record = data[0];
      return {
        id: record.id,
        timestamp: record.created_at,
        note: record.note || '',
        nickname: record.user_nickname
      };
    } catch (e) {
      console.warn('Supabase 写入失败，使用本地存储:', e.message);
      const records = getLocalRecords();
      const newRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        note,
        nickname
      };
      records.push(newRecord);
      saveLocalRecords(records);
      return newRecord;
    }
  } else {
    const records = getLocalRecords();
    const newRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      note,
      nickname
    };
    records.push(newRecord);
    saveLocalRecords(records);
    return newRecord;
  }
}

export async function deleteRecord(id) {
  if (isSupabaseAvailable) {
    try {
      const { error } = await supabase
        .from('poo_records')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase 删除失败，使用本地存储:', e.message);
      const records = getLocalRecords();
      const filtered = records.filter(r => r.id !== id);
      saveLocalRecords(filtered);
      return true;
    }
  } else {
    const records = getLocalRecords();
    const filtered = records.filter(r => r.id !== id);
    saveLocalRecords(filtered);
    return true;
  }
}

export async function getRecordsByDate(dateStr, nickname = null) {
  const records = await fetchAllRecords();
  return records
    .filter(r => {
      if (nickname && r.nickname !== nickname) return false;
      return r.timestamp.split('T')[0] === dateStr;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function getTodayRecords(nickname = null) {
  const records = await fetchAllRecords();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  return records
    .filter(r => {
      if (nickname && r.nickname !== nickname) return false;
      return r.timestamp >= startOfDay;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function getWeekStats(nickname = null) {
  const records = await fetchAllRecords();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const weekRecords = records.filter(r => {
    if (nickname && r.nickname !== nickname) return false;
    return new Date(r.timestamp) >= weekStart;
  });

  const dailyCounts = {};
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyCounts[dateStr] = 0;
  }

  weekRecords.forEach(r => {
    const dateStr = r.timestamp.split('T')[0];
    if (dailyCounts[dateStr] !== undefined) {
      dailyCounts[dateStr]++;
    }
  });

  const totalDays = Object.values(dailyCounts).filter(v => v > 0).length || 1;
  const totalCount = weekRecords.length;
  const avgPerDay = (totalCount / totalDays).toFixed(1);

  return {
    dailyCounts,
    totalCount,
    avgPerDay,
    daysTracked: totalDays
  };
}

export async function getAllUserStats() {
  const records = await fetchAllRecords();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const weekRecords = records.filter(r => new Date(r.timestamp) >= weekStart);

  const userMap = {};
  weekRecords.forEach(r => {
    const nickname = r.nickname || '匿名';
    if (!userMap[nickname]) {
      userMap[nickname] = {
        nickname,
        totalCount: 0,
        todayCount: 0,
        dailyCounts: {}
      };
    }
    const dateStr = r.timestamp.split('T')[0];
    userMap[nickname].totalCount++;
    userMap[nickname].dailyCounts[dateStr] = (userMap[nickname].dailyCounts[dateStr] || 0) + 1;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (dateStr === todayStr) {
      userMap[nickname].todayCount++;
    }
  });

  return Object.values(userMap);
}

export function isNormal(dayCount) {
  return dayCount >= 1 && dayCount <= 3;
}
