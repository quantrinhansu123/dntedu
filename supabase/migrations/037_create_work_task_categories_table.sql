-- Bảng lưu danh sách hạng mục công việc (dùng cho dropdown Setup công việc)
CREATE TABLE IF NOT EXISTS work_task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_task_categories_name ON work_task_categories(name);

ALTER TABLE work_task_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read work_task_categories" ON work_task_categories;
DROP POLICY IF EXISTS "Allow insert work_task_categories" ON work_task_categories;

CREATE POLICY "Allow read work_task_categories" ON work_task_categories
  FOR SELECT USING (true);

CREATE POLICY "Allow insert work_task_categories" ON work_task_categories
  FOR INSERT WITH CHECK (true);
