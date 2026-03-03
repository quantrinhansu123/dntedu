-- Add task_statuses field to daily_work_reports table
-- This field stores status and notes for each work task

ALTER TABLE daily_work_reports 
ADD COLUMN IF NOT EXISTS task_statuses JSONB DEFAULT '{}'::jsonb;

-- Create index for task_statuses JSONB field
CREATE INDEX IF NOT EXISTS idx_daily_work_reports_task_statuses 
ON daily_work_reports USING GIN (task_statuses);

-- Add comment
COMMENT ON COLUMN daily_work_reports.task_statuses IS 'Stores task status and notes: {"taskId": {"status": "Đã hoàn thành", "note": "..."}}';
