-- Simple migration to create classes table
-- Run this first if the full migration fails

-- Drop table if exists (for testing)
-- DROP TABLE IF EXISTS classes CASCADE;

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  curriculum TEXT,
  course_id TEXT,
  course_name TEXT,
  age_group TEXT,
  progress TEXT,
  total_sessions INTEGER,
  teacher TEXT,
  teacher_id TEXT,
  teacher_duration INTEGER,
  assistant TEXT,
  assistant_duration INTEGER,
  foreign_teacher TEXT,
  foreign_teacher_duration INTEGER,
  students_count INTEGER NOT NULL DEFAULT 0,
  trial_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  debt_students INTEGER DEFAULT 0,
  reserved_students INTEGER DEFAULT 0,
  schedule TEXT,
  schedule_details JSONB,
  room TEXT,
  branch TEXT,
  color INTEGER,
  start_date DATE,
  end_date DATE,
  training_history JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_classes_name ON classes(name);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_created_at ON classes(created_at);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Create basic policy
DROP POLICY IF EXISTS "Allow all operations" ON classes;
CREATE POLICY "Allow all operations" ON classes
  FOR ALL
  USING (true)
  WITH CHECK (true);
