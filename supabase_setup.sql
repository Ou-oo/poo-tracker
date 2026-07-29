-- 在 Supabase SQL Editor 中执行此 SQL 创建表
CREATE TABLE IF NOT EXISTS poo_records (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_nickname TEXT NOT NULL DEFAULT '匿名',
  note TEXT DEFAULT ''
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_poo_records_created_at ON poo_records (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poo_records_nickname ON poo_records (user_nickname);

-- 设置行级安全策略（RLS）
ALTER TABLE poo_records ENABLE ROW LEVEL SECURITY;

-- 允许任何人查看和插入记录（简单场景）
CREATE POLICY "允许所有人查看记录" ON poo_records
  FOR SELECT USING (true);

CREATE POLICY "允许所有人插入记录" ON poo_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "允许所有人删除记录" ON poo_records
  FOR DELETE USING (true);
