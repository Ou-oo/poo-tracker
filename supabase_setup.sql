-- 在 Supabase SQL Editor 中执行此 SQL 创建表

-- 1. 创建表（如果不存在）
CREATE TABLE IF NOT EXISTS poo_records (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_nickname TEXT NOT NULL DEFAULT '匿名',
  note TEXT DEFAULT '',
  mood TEXT DEFAULT ''
);

-- 1.1 为已有表添加 mood 列（如果不存在）
ALTER TABLE poo_records ADD COLUMN IF NOT EXISTS mood TEXT DEFAULT '';

-- 2. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_poo_records_created_at ON poo_records (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poo_records_nickname ON poo_records (user_nickname);

-- 3. 先删除已存在的策略（以便重新创建）
DROP POLICY IF EXISTS "允许所有人查看记录" ON poo_records;
DROP POLICY IF EXISTS "允许所有人插入记录" ON poo_records;
DROP POLICY IF EXISTS "允许所有人删除记录" ON poo_records;

-- 4. 启用行级安全策略（RLS）
ALTER TABLE poo_records ENABLE ROW LEVEL SECURITY;

-- 5. 创建新策略：允许任何人查看和插入记录
CREATE POLICY "允许所有人查看记录" ON poo_records
  FOR SELECT USING (true);

CREATE POLICY "允许所有人插入记录" ON poo_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "允许所有人删除记录" ON poo_records
  FOR DELETE USING (true);

-- 执行完毕后，刷新 Supabase Table Editor 确认 poo_records 表存在即可

-- ============================================
-- 互动表（点赞/收藏/评论/疑问 + 通知）
-- ============================================

CREATE TABLE IF NOT EXISTS poo_interactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  record_id BIGINT NOT NULL,
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'like',
  content TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_poo_interactions_to_user ON poo_interactions (to_user, is_read);
CREATE INDEX IF NOT EXISTS idx_poo_interactions_record ON poo_interactions (record_id);

ALTER TABLE poo_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "允许所有人查看互动" ON poo_interactions;
DROP POLICY IF EXISTS "允许所有人插入互动" ON poo_interactions;
DROP POLICY IF EXISTS "允许所有人更新互动" ON poo_interactions;
DROP POLICY IF EXISTS "允许所有人删除互动" ON poo_interactions;

CREATE POLICY "允许所有人查看互动" ON poo_interactions
  FOR SELECT USING (true);

CREATE POLICY "允许所有人插入互动" ON poo_interactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "允许所有人更新互动" ON poo_interactions
  FOR UPDATE USING (true);

CREATE POLICY "允许所有人删除互动" ON poo_interactions
  FOR DELETE USING (true);

