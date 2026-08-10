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
        mood: r.mood || '',
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

export async function addRecord(note = '', mood = '') {
  const nickname = ensureNickname();
  if (isSupabaseAvailable) {
    try {
      const { data, error } = await supabase
        .from('poo_records')
        .insert([{ user_nickname: nickname, note, mood }])
        .select();
      if (error) throw error;
      const record = data[0];
      return {
        id: record.id,
        timestamp: record.created_at,
        note: record.note || '',
        mood: record.mood || '',
        nickname: record.user_nickname
      };
    } catch (e) {
      console.warn('Supabase 写入失败，使用本地存储:', e.message);
      const records = getLocalRecords();
      const newRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        note,
        mood,
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
      mood,
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

export async function deleteTestRecords() {
  if (isSupabaseAvailable) {
    try {
      const { error } = await supabase
        .from('poo_records')
        .delete()
        .ilike('user_nickname', 'user%');
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('删除测试数据失败:', e.message);
      return false;
    }
  }
  return false;
}

// ========== 互动功能（点赞/收藏/评论/疑问） ==========

const INTERACTION_LOCAL_KEY = 'poo_interactions_local';

function getLocalInteractions() {
  const data = localStorage.getItem(INTERACTION_LOCAL_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalInteractions(records) {
  localStorage.setItem(INTERACTION_LOCAL_KEY, JSON.stringify(records));
}

export async function addInteraction(recordId, toUser, type, content = '') {
  const fromUser = ensureNickname();
  if (isSupabaseAvailable) {
    try {
      const { data, error } = await supabase
        .from('poo_interactions')
        .insert([{ record_id: recordId, from_user: fromUser, to_user: toUser, type, content }])
        .select();
      if (error) throw error;
      return {
        id: data[0].id,
        recordId: data[0].record_id,
        fromUser: data[0].from_user,
        toUser: data[0].to_user,
        type: data[0].type,
        content: data[0].content || '',
        timestamp: data[0].created_at,
        isRead: data[0].is_read
      };
    } catch (e) {
      console.warn('Supabase 互动写入失败:', e.message);
      return null;
    }
  }
  return null;
}

export async function getInteractionsForRecord(recordId) {
  if (isSupabaseAvailable) {
    try {
      const { data, error } = await supabase
        .from('poo_interactions')
        .select('*')
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(i => ({
        id: i.id,
        recordId: i.record_id,
        fromUser: i.from_user,
        toUser: i.to_user,
        type: i.type,
        content: i.content || '',
        timestamp: i.created_at,
        isRead: i.is_read
      }));
    } catch (e) {
      console.warn('获取互动失败:', e.message);
      return [];
    }
  }
  return getLocalInteractions().filter(i => i.recordId === recordId);
}

export async function getNotifications(nickname) {
  if (isSupabaseAvailable) {
    try {
      const { data, error } = await supabase
        .from('poo_interactions')
        .select('*')
        .eq('to_user', nickname)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(i => ({
        id: i.id,
        recordId: i.record_id,
        fromUser: i.from_user,
        toUser: i.to_user,
        type: i.type,
        content: i.content || '',
        timestamp: i.created_at,
        isRead: i.is_read
      }));
    } catch (e) {
      console.warn('获取通知失败:', e.message);
      return [];
    }
  }
  return getLocalInteractions().filter(i => i.toUser === nickname);
}

export async function getUnreadCount(nickname) {
  if (isSupabaseAvailable) {
    try {
      const { count, error } = await supabase
        .from('poo_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('to_user', nickname)
        .eq('is_read', false);
      if (error) throw error;
      return count || 0;
    } catch (e) {
      console.warn('获取未读数失败:', e.message);
      return 0;
    }
  }
  return getLocalInteractions().filter(i => i.toUser === nickname && !i.isRead).length;
}

export async function markAllRead(nickname) {
  if (isSupabaseAvailable) {
    try {
      const { error } = await supabase
        .from('poo_interactions')
        .update({ is_read: true })
        .eq('to_user', nickname)
        .eq('is_read', false);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('标记已读失败:', e.message);
      return false;
    }
  }
  const records = getLocalInteractions();
  records.forEach(i => { if (i.toUser === nickname) i.isRead = true; });
  saveLocalInteractions(records);
  return true;
}
