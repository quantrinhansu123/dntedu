/**
 * Daily Work Report Page
 * Nhân sự báo cáo công việc hôm nay đã hoàn thành
 * Quản lý xác nhận: Đạt, Chấp nhận, Không đạt kèm lý do
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  FileText,
  Calendar,
  User,
  Search,
  Filter,
  Briefcase,
  FolderOpen,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../src/hooks/useAuth';
import { usePermissions } from '../src/hooks/usePermissions';
import { useStaff } from '../src/hooks/useStaff';
import * as dailyWorkReportService from '../src/services/dailyWorkReportSupabaseService';
import type { DailyWorkReport } from '../src/services/dailyWorkReportSupabaseService';
import * as workTaskService from '../src/services/workTaskSupabaseService';
import type { WorkTask } from '../src/services/workTaskSupabaseService';

export const DailyWorkReportPage: React.FC = () => {
  const { user, staffData } = useAuth();
  const { canApprove, isAdmin, isManager } = usePermissions();
  const { staff: staffList } = useStaff();
  
  const canApproveReports = canApprove('work_reports') || isAdmin || isManager;
  const currentStaffId = staffData?.id || user?.uid || '';
  const currentStaffName = staffData?.name || user?.email || '';
  
  // Debug: Log current staff info
  useEffect(() => {
    console.log('DailyWorkReport - Current staff info:', {
      staffId: currentStaffId,
      staffName: currentStaffName,
      staffData: staffData,
      user: user
    });
  }, [currentStaffId, currentStaffName, staffData, user]);

  const [reports, setReports] = useState<DailyWorkReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Work tasks from setup
  const [workTasks, setWorkTasks] = useState<WorkTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  // Selected staff for viewing tasks
  const [selectedStaffId, setSelectedStaffId] = useState<string>(currentStaffId);
  
  // Task status and notes for each checked task
  const [taskStatuses, setTaskStatuses] = useState<Record<string, {
    status: string;
    note: string;
  }>>({});
  
  // Modal state for task checklist
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Auto-save debounce timer
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Form state
  const today = new Date().toISOString().split('T')[0];
  const [reportDate, setReportDate] = useState(today);
  const [workDescription, setWorkDescription] = useState('');
  const [tasks, setTasks] = useState<string[]>(['']);
  const [note, setNote] = useState('');
  const [editingReport, setEditingReport] = useState<DailyWorkReport | null>(null);

  // Approval modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyWorkReport | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'Đạt' | 'Chấp nhận' | 'Không đạt'>('Đạt');
  const [approvalReason, setApprovalReason] = useState('');

  // Filters
  const [filterStaffId, setFilterStaffId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Update selectedStaffId when currentStaffId changes
  useEffect(() => {
    if (currentStaffId && !selectedStaffId) {
      setSelectedStaffId(currentStaffId);
    }
  }, [currentStaffId]);

  // Load work tasks for selected staff - reload when date or selected staff changes
  useEffect(() => {
    if (selectedStaffId) {
      loadWorkTasksForStaff(selectedStaffId);
    }
  }, [selectedStaffId, reportDate]);

  // Load reports
  useEffect(() => {
    fetchReports();
  }, [filterStaffId, filterDate, filterStatus]);

  const loadWorkTasksForStaff = async (staffId: string) => {
    try {
      // Load all active work tasks for selected staff member
      // These tasks will automatically appear each day
      console.log('=== Loading work tasks ===');
      console.log('Selected staffId:', staffId);
      
      // Find selected staff info
      const selectedStaff = staffList.find(s => s.id === staffId);
      console.log('Selected staff info:', selectedStaff);
      
      if (!staffId) {
        console.warn('No staffId available! Cannot load work tasks.');
        setError('Chưa chọn nhân sự.');
        return;
      }
      
      // Debug: Load ALL tasks to see what staff_ids are stored
      const allTasks = await workTaskService.getAllWorkTasks();
      console.log('=== ALL WORK TASKS (for debugging) ===');
      allTasks.forEach(task => {
        console.log(`Task: "${task.taskName}" (ID: ${task.id})`);
        console.log(`  - staffIds:`, task.staffIds);
        console.log(`  - staffNames:`, task.staffNames);
        console.log(`  - isActive:`, task.isActive);
        console.log(`  - Looking for staffId: "${staffId}"`);
        console.log(`  - Match:`, task.staffIds.includes(staffId));
      });
      
      const tasks = await workTaskService.getWorkTasksByStaffId(staffId);
      console.log('=== Loaded work tasks ===');
      console.log('Total tasks found:', tasks.length);
      console.log('Tasks:', tasks);
      
      setWorkTasks(tasks);
      
      if (tasks.length === 0) {
        console.warn('⚠️ No work tasks found for staff:', staffId, selectedStaff?.name);
        console.warn('Please check:');
        console.warn('1. Tasks are created in "Setup công việc" tab');
        console.warn('2. Tasks are assigned to this staff member');
        console.warn('3. Staff ID in work_tasks.staff_ids matches:', staffId);
        console.warn('4. Tasks are active (isActive = true)');
        console.warn('5. All available staff IDs in tasks:', allTasks.map(t => ({ name: t.taskName, staffIds: t.staffIds })));
      } else {
        console.log('✅ Successfully loaded', tasks.length, 'work tasks');
      }
    } catch (err) {
      console.error('❌ Error loading work tasks:', err);
      setError('Không thể tải danh sách công việc từ setup: ' + (err as Error).message);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (filterStaffId) filters.staffId = filterStaffId;
      if (filterDate) filters.reportDate = filterDate;
      if (filterStatus) filters.status = filterStatus;
      
      // If not admin/manager, only show own reports
      if (!canApproveReports) {
        filters.staffId = currentStaffId;
      }
      
      const data = await dailyWorkReportService.queryDailyWorkReports(filters);
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // Check if today's report exists and load task statuses
  useEffect(() => {
    if (selectedStaffId && reportDate) {
      checkTodayReport();
    }
  }, [selectedStaffId, reportDate]);
  
  // Load task statuses from existing report
  useEffect(() => {
    const todayReport = reports.find(r => 
      r.staffId === selectedStaffId && 
      r.reportDate === reportDate
    );
    if (todayReport && todayReport.taskStatuses) {
      setTaskStatuses(todayReport.taskStatuses);
    } else {
      setTaskStatuses({});
    }
  }, [reports, selectedStaffId, reportDate]);

  // Reset selected tasks when report date changes
  useEffect(() => {
    setSelectedTaskIds([]);
  }, [reportDate]);

  const checkTodayReport = async () => {
    try {
      const existing = await dailyWorkReportService.getDailyWorkReportByStaffAndDate(
        selectedStaffId,
        reportDate
      );
      if (existing) {
        setEditingReport(existing);
        setWorkDescription(existing.workDescription);
        setTasks(existing.completedTasks.length > 0 ? existing.completedTasks : ['']);
        setNote(existing.note || '');
        // Load task statuses from existing report
        if (existing.taskStatuses) {
          setTaskStatuses(existing.taskStatuses);
        }
        // Set selected tasks from existing report
        const existingTaskNames = existing.completedTasks;
        const selectedIds = workTasks
          .filter(wt => existingTaskNames.includes(wt.taskName))
          .map(wt => wt.id);
        setSelectedTaskIds(selectedIds);
      } else {
        setEditingReport(null);
        setWorkDescription('');
        setTasks(['']);
        setNote('');
        setSelectedTaskIds([]);
        setTaskStatuses({});
      }
    } catch (err) {
      console.error('Error checking today report:', err);
    }
  };
  
  // Auto-save task statuses to database
  const saveTaskStatuses = async (statuses: Record<string, { status: string; note: string }>) => {
    try {
      const selectedStaff = staffList.find(s => s.id === selectedStaffId);
      const staffName = selectedStaff?.name || currentStaffName;
      
      // Get or create today's report
      let todayReport = reports.find(r => 
        r.staffId === selectedStaffId && 
        r.reportDate === reportDate
      );

      if (!todayReport) {
        // Create new report with task statuses
        const newReport = await dailyWorkReportService.createDailyWorkReport({
          staffId: selectedStaffId,
          staffName: staffName,
          reportDate,
          workDescription: '',
          completedTasks: [],
          taskStatuses: statuses,
          status: 'Chờ xác nhận',
          note: null,
        });
        todayReport = newReport;
        setReports([...reports, todayReport]);
      } else {
        // Update existing report with task statuses
        const updatedReport = await dailyWorkReportService.updateDailyWorkReport(todayReport.id, {
          taskStatuses: statuses,
        });
        setReports(reports.map(r => r.id === todayReport!.id ? updatedReport : r));
      }
    } catch (err) {
      console.error('Error saving task statuses:', err);
      // Don't show alert for auto-save errors
    }
  };
  
  // Debounced auto-save
  const handleTaskStatusChange = (taskId: string, status: string, note: string) => {
    const newStatuses = {
      ...taskStatuses,
      [taskId]: { status, note }
    };
    setTaskStatuses(newStatuses);
    
    // Clear existing timer
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    
    // Set new timer to save after 1 second of inactivity
    const timer = setTimeout(() => {
      saveTaskStatuses(newStatuses);
    }, 1000);
    setSaveTimer(timer);
  };
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
    };
  }, [saveTimer]);

  const handleAddTask = () => {
    setTasks([...tasks, '']);
  };

  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };

  const handleRemoveTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSubmit = async () => {
    if (!workDescription.trim()) {
      alert('Vui lòng nhập mô tả công việc');
      return;
    }

    try {
      setLoading(true);
      
      // Combine selected work tasks and manual tasks
      const selectedTaskNames = workTasks
        .filter(wt => selectedTaskIds.includes(wt.id))
        .map(wt => wt.taskName);
      const manualTasks = tasks.filter(t => t.trim() !== '');
      const completedTasks = [...selectedTaskNames, ...manualTasks];
      
      const reportData: Omit<DailyWorkReport, 'id' | 'createdAt' | 'updatedAt'> = {
        staffId: currentStaffId,
        staffName: currentStaffName,
        reportDate,
        workDescription: workDescription.trim(),
        completedTasks,
        status: 'Chờ xác nhận',
        note: note.trim() || null,
      };

      if (editingReport) {
        await dailyWorkReportService.updateDailyWorkReport(editingReport.id, reportData);
      } else {
        await dailyWorkReportService.createDailyWorkReport(reportData);
      }

      // Reset form
        setWorkDescription('');
        setTasks(['']);
        setNote('');
        setEditingReport(null);
        setReportDate(today);
        setSelectedTaskIds([]);
      
      await fetchReports();
      alert(editingReport ? 'Cập nhật báo cáo thành công!' : 'Gửi báo cáo thành công!');
    } catch (err) {
      console.error('Error saving report:', err);
      alert('Lỗi khi lưu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (report: DailyWorkReport) => {
    if (!confirm('Bạn có chắc muốn xóa báo cáo này?')) return;
    
    try {
      await dailyWorkReportService.deleteDailyWorkReport(report.id);
      await fetchReports();
      alert('Xóa báo cáo thành công!');
    } catch (err) {
      console.error('Error deleting report:', err);
      alert('Lỗi khi xóa báo cáo');
    }
  };

  const handleOpenApprovalModal = (report: DailyWorkReport) => {
    setSelectedReport(report);
    setApprovalStatus(report.approvalStatus || 'Đạt');
    setApprovalReason(report.approvalReason || '');
    setApprovalModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedReport) return;
    if (!approvalReason.trim() && approvalStatus === 'Không đạt') {
      alert('Vui lòng nhập lý do khi không đạt');
      return;
    }

    try {
      setLoading(true);
      await dailyWorkReportService.approveDailyWorkReport(
        selectedReport.id,
        approvalStatus,
        approvalReason.trim(),
        currentStaffName
      );
      
      setApprovalModalOpen(false);
      setSelectedReport(null);
      setApprovalReason('');
      await fetchReports();
      alert('Xác nhận báo cáo thành công!');
    } catch (err) {
      console.error('Error approving report:', err);
      alert('Lỗi khi xác nhận báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    let filtered = reports;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.staffName.toLowerCase().includes(term) ||
        r.workDescription.toLowerCase().includes(term) ||
        r.completedTasks.some(t => t.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  }, [reports, searchTerm]);

  const getStatusBadge = (status: string) => {
    const badges = {
      'Chờ xác nhận': 'bg-yellow-100 text-yellow-800',
      'Đạt': 'bg-green-100 text-green-800',
      'Chấp nhận': 'bg-blue-100 text-blue-800',
      'Không đạt': 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  // Group work tasks by category
  const tasksByCategory = useMemo(() => {
    const grouped: Record<string, WorkTask[]> = {};
    workTasks.forEach(task => {
      if (!grouped[task.category]) {
        grouped[task.category] = [];
      }
      grouped[task.category].push(task);
    });
    return grouped;
  }, [workTasks]);

  // Check which tasks are completed today - always show all tasks from setup
  // Tasks from setup will automatically appear each day, regardless of whether there's a report
  const completedTaskIds = useMemo(() => {
    const todayReport = reports.find(r => 
      r.staffId === selectedStaffId && 
      r.reportDate === reportDate
    );
    if (!todayReport) return [];
    
    const completedNames = todayReport.completedTasks || [];
    return workTasks
      .filter(wt => completedNames.includes(wt.taskName))
      .map(wt => wt.id);
  }, [reports, selectedStaffId, reportDate, workTasks]);

  // This function is kept for backward compatibility but may not be used with new UI
  const handleToggleTaskComplete = async (taskId: string, taskName: string) => {
    // This is now handled by the checkbox with task statuses
    // Keeping for backward compatibility
  };

  const [showReportForm, setShowReportForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Công việc Hôm nay
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {new Date(reportDate).toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            max={today}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={() => {
              if (selectedStaffId) {
                loadWorkTasksForStaff(selectedStaffId);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            title="Tải lại danh sách công việc"
          >
            <Search className="w-4 h-4" />
            Tải lại
          </button>
          <button
            onClick={() => setShowReportForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Thêm Báo cáo
          </button>
        </div>
      </div>

      {/* Staff Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn nhân sự để xem công việc
        </label>
        <select
          value={selectedStaffId}
          onChange={(e) => {
            const newStaffId = e.target.value;
            const selectedStaff = staffList.find(s => s.id === newStaffId);
            console.log('=== Staff selection changed ===');
            console.log('From:', selectedStaffId);
            console.log('To:', newStaffId);
            console.log('Staff name:', selectedStaff?.name);
            console.log('Staff info:', selectedStaff);
            setSelectedStaffId(newStaffId);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {staffList.map(staff => (
            <option key={staff.id} value={staff.id}>
              {staff.name} {staff.code ? `(${staff.code})` : ''}
            </option>
          ))}
        </select>
        {selectedStaffId && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
            <p className="text-gray-700">
              <strong>Đã chọn:</strong> {staffList.find(s => s.id === selectedStaffId)?.name}
            </p>
            <p className="text-gray-500">
              Staff ID: <code className="bg-white px-1 rounded">{selectedStaffId}</code>
            </p>
            <p className="text-gray-500">
              Staff Code: <code className="bg-white px-1 rounded">{staffList.find(s => s.id === selectedStaffId)?.code || 'N/A'}</code>
            </p>
            {workTasks.length > 0 && (
              <p className="text-green-600 mt-1">
                ✓ Tìm thấy {workTasks.length} công việc
              </p>
            )}
            {workTasks.length === 0 && selectedStaffId && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 font-medium mb-1">
                  ⚠ Chưa có công việc nào được gán cho nhân sự này
                </p>
                <p className="text-yellow-700 text-xs">
                  Vui lòng kiểm tra:
                </p>
                <ul className="text-yellow-700 text-xs list-disc list-inside mt-1 space-y-0.5">
                  <li>Đã tạo công việc trong tab "Setup công việc"</li>
                  <li>Đã gán nhân sự này cho công việc</li>
                  <li>Công việc đang ở trạng thái "Hoạt động"</li>
                  <li>Staff ID trong công việc khớp với: <code className="bg-yellow-100 px-1 rounded">{selectedStaffId}</code></li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Work Tasks List - Tự động hiển thị công việc từ setup mỗi ngày */}
      {!selectedStaffId ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Lưu ý:</strong> Vui lòng chọn nhân sự để xem công việc.
          </p>
        </div>
      ) : workTasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2 font-medium">Chưa có công việc nào được setup cho nhân sự này</p>
          <p className="text-sm text-gray-500 mb-4">
            Vui lòng vào tab <strong>"Setup công việc"</strong> để tạo công việc và gán cho nhân sự tương ứng.
          </p>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Danh sách công việc dưới đây được tự động hiển thị từ Setup công việc. 
            Nhấn vào checkbox để đánh dấu và nhập trạng thái, ghi chú.
          </p>
        </div>
      )}
      
      {/* Button to open task checklist modal */}
      {workTasks.length > 0 && selectedStaffId && (
        <div className="mb-4">
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <CheckSquare className="w-4 h-4" />
            Xem danh sách công việc ({workTasks.length})
          </button>
        </div>
      )}

      {/* Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Thêm Báo cáo Công việc</h3>
              <button
                onClick={() => {
                  setShowReportForm(false);
                  setEditingReport(null);
                  setWorkDescription('');
                  setTasks(['']);
                  setNote('');
                  setSelectedTaskIds([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Report Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày báo cáo
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  max={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả công việc đã hoàn thành <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  rows={4}
                  placeholder="Mô tả chi tiết công việc đã hoàn thành hôm nay..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Work Tasks from Setup */}
              {workTasks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Công việc đã setup
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {workTasks.map(task => (
                        <label
                          key={task.id}
                          className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.includes(task.id)}
                            onChange={() => handleToggleTask(task.id)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{task.taskName}</div>
                            <div className="text-xs text-gray-500">{task.category}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedTaskIds.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      Đã chọn: {selectedTaskIds.length} công việc
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh sách công việc đã hoàn thành {workTasks.length > 0 && '(hoặc thêm công việc khác)'}
                </label>
                <div className="space-y-2">
                  {tasks.map((task, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={task}
                        onChange={(e) => handleTaskChange(index, e.target.value)}
                        placeholder={`Công việc ${index + 1}...`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {tasks.length > 1 && (
                        <button
                          onClick={() => handleRemoveTask(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddTask}
                    className="flex items-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm công việc khác
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú thêm
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú thêm (nếu có)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang lưu...' : editingReport ? 'Cập nhật Báo cáo' : 'Gửi Báo cáo'}
                </button>
                <button
                  onClick={() => {
                    setShowReportForm(false);
                    setEditingReport(null);
                    setWorkDescription('');
                    setTasks(['']);
                    setNote('');
                    setSelectedTaskIds([]);
                  }}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports List Section */}
      {reports.filter(r => r.staffId === selectedStaffId && r.reportDate === reportDate).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Báo cáo chi tiết</h3>
          <div className="space-y-3">
            {reports
              .filter(r => r.staffId === selectedStaffId && r.reportDate === reportDate)
              .map(report => (
                <div key={report.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {report.workDescription && (
                        <p className="text-gray-900 mb-2">{report.workDescription}</p>
                      )}
                      {report.completedTasks && report.completedTasks.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Công việc đã hoàn thành:</span>
                          <ul className="list-disc list-inside mt-1">
                            {report.completedTasks.map((task, i) => (
                              <li key={i}>{task}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {report.note && (
                        <p className="text-sm text-gray-500 mt-2 italic">Ghi chú: {report.note}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingReport(report);
                          setReportDate(report.reportDate);
                          setWorkDescription(report.workDescription);
                          setTasks(report.completedTasks.length > 0 ? report.completedTasks : ['']);
                          setNote(report.note || '');
                          const selectedIds = workTasks
                            .filter(wt => report.completedTasks.includes(wt.taskName))
                            .map(wt => wt.id);
                          setSelectedTaskIds(selectedIds);
                          setShowReportForm(true);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(report)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(report.status)}`}>
                      {report.status}
                    </span>
                    {report.approvalStatus && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">
                          {report.approvalStatus}
                          {report.approvalReason && `: ${report.approvalReason}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}


      {/* Task Checklist Modal - 2 bảng: Chưa check và Đã check */}
      {showTaskModal && selectedStaffId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Danh sách công việc - {staffList.find(s => s.id === selectedStaffId)?.name}
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - 2 bảng */}
            <div className="flex-1 overflow-hidden flex gap-4 p-4">
              {/* Bảng 1: Công việc chưa check */}
              <div className="flex-1 border border-gray-200 rounded-lg flex flex-col overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">
                    Chưa check ({workTasks.filter(t => !taskStatuses[t.id]).length})
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {workTasks
                    .filter(task => !taskStatuses[task.id])
                    .map(task => (
                      <div
                        key={task.id}
                        className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                      >
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={async () => {
                              const newStatuses = {
                                ...taskStatuses,
                                [task.id]: { status: 'Đã hoàn thành', note: '' }
                              };
                              setTaskStatuses(newStatuses);
                              await saveTaskStatuses(newStatuses);
                            }}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-900 flex-1">{task.taskName}</span>
                        </label>
                      </div>
                    ))}
                  {workTasks.filter(task => !taskStatuses[task.id]).length === 0 && (
                    <div className="text-center text-sm text-gray-500 py-8">
                      Không còn công việc nào
                    </div>
                  )}
                </div>
              </div>

              {/* Bảng 2: Công việc đã check */}
              <div className="flex-1 border border-gray-200 rounded-lg flex flex-col overflow-hidden">
                <div className="bg-indigo-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">
                    Đã check ({workTasks.filter(t => taskStatuses[t.id]).length})
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {workTasks
                    .filter(task => taskStatuses[task.id])
                    .map(task => {
                      const taskStatus = taskStatuses[task.id] || { status: 'Đã hoàn thành', note: '' };
                      return (
                        <div
                          key={task.id}
                          className="p-3 border border-indigo-200 bg-indigo-50 rounded-lg"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={async () => {
                                const newStatuses = { ...taskStatuses };
                                delete newStatuses[task.id];
                                setTaskStatuses(newStatuses);
                                await saveTaskStatuses(newStatuses);
                              }}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                            />
                            <span className="text-sm font-medium text-gray-900 flex-1">{task.taskName}</span>
                            <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          </div>
                          
                          {/* Status và Note - Compact */}
                          <div className="mt-2 space-y-2 pl-6">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
                              <select
                                value={taskStatus.status}
                                onChange={(e) => handleTaskStatusChange(task.id, e.target.value, taskStatus.note)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="Đã hoàn thành">Đã hoàn thành</option>
                                <option value="Đang làm">Đang làm</option>
                                <option value="Chưa làm">Chưa làm</option>
                                <option value="Gặp vấn đề">Gặp vấn đề</option>
                                <option value="Tạm dừng">Tạm dừng</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label>
                              <textarea
                                value={taskStatus.note}
                                onChange={(e) => handleTaskStatusChange(task.id, taskStatus.status, e.target.value)}
                                rows={2}
                                placeholder="Ghi chú..."
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {workTasks.filter(task => taskStatuses[task.id]).length === 0 && (
                    <div className="text-center text-sm text-gray-500 py-8">
                      Chưa có công việc nào được check
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Xác nhận Báo cáo Công việc</h3>
              <button
                onClick={() => {
                  setApprovalModalOpen(false);
                  setSelectedReport(null);
                  setApprovalReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nhân sự</label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg">{selectedReport.staffName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày báo cáo</label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {new Date(selectedReport.reportDate).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả công việc</label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {selectedReport.workDescription}
                </div>
              </div>
              {selectedReport.completedTasks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Công việc đã hoàn thành</label>
                  <ul className="list-disc list-inside space-y-1 px-3 py-2 bg-gray-50 rounded-lg">
                    {selectedReport.completedTasks.map((task, i) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái xác nhận <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Đạt', 'Chấp nhận', 'Không đạt'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setApprovalStatus(status)}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                        approvalStatus === status
                          ? status === 'Đạt'
                            ? 'bg-green-600 text-white'
                            : status === 'Chấp nhận'
                            ? 'bg-blue-600 text-white'
                            : 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do {approvalStatus === 'Không đạt' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  rows={3}
                  placeholder="Nhập lý do xác nhận..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={loading || (approvalStatus === 'Không đạt' && !approvalReason.trim())}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận
              </button>
              <button
                onClick={() => {
                  setApprovalModalOpen(false);
                  setSelectedReport(null);
                  setApprovalReason('');
                }}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
