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
  FolderOpen
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

  const [reports, setReports] = useState<DailyWorkReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Work tasks from setup
  const [workTasks, setWorkTasks] = useState<WorkTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

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

  // Load work tasks for current staff
  useEffect(() => {
    if (currentStaffId) {
      loadWorkTasks();
    }
  }, [currentStaffId]);

  // Load reports
  useEffect(() => {
    fetchReports();
  }, [filterStaffId, filterDate, filterStatus]);

  const loadWorkTasks = async () => {
    try {
      const tasks = await workTaskService.getWorkTasksByStaffId(currentStaffId);
      setWorkTasks(tasks);
    } catch (err) {
      console.error('Error loading work tasks:', err);
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

  // Check if today's report exists
  useEffect(() => {
    if (currentStaffId && reportDate) {
      checkTodayReport();
    }
  }, [currentStaffId, reportDate]);

  // Reset selected tasks when report date changes
  useEffect(() => {
    setSelectedTaskIds([]);
  }, [reportDate]);

  const checkTodayReport = async () => {
    try {
      const existing = await dailyWorkReportService.getDailyWorkReportByStaffAndDate(
        currentStaffId,
        reportDate
      );
      if (existing) {
        setEditingReport(existing);
        setWorkDescription(existing.workDescription);
        setTasks(existing.completedTasks.length > 0 ? existing.completedTasks : ['']);
        setNote(existing.note || '');
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
      }
    } catch (err) {
      console.error('Error checking today report:', err);
    }
  };

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

  // Check which tasks are completed today
  const completedTaskIds = useMemo(() => {
    const todayReport = reports.find(r => 
      r.staffId === currentStaffId && 
      r.reportDate === reportDate
    );
    if (!todayReport) return [];
    
    const completedNames = todayReport.completedTasks || [];
    return workTasks
      .filter(wt => completedNames.includes(wt.taskName))
      .map(wt => wt.id);
  }, [reports, currentStaffId, reportDate, workTasks]);

  const handleToggleTaskComplete = async (taskId: string, taskName: string) => {
    const isCompleted = completedTaskIds.includes(taskId);
    
    try {
      // Get or create today's report
      let todayReport = reports.find(r => 
        r.staffId === currentStaffId && 
        r.reportDate === reportDate
      );

      if (!todayReport) {
        // Create new report
        const newReport = await dailyWorkReportService.createDailyWorkReport({
          staffId: currentStaffId,
          staffName: currentStaffName,
          reportDate,
          workDescription: '',
          completedTasks: isCompleted 
            ? [] 
            : [taskName],
          status: 'Cho xac nhan',
          note: null,
        });
        todayReport = {
          id: newReport.id,
          staffId: newReport.staffId,
          staffName: newReport.staffName,
          reportDate: newReport.reportDate,
          workDescription: newReport.workDescription,
          completedTasks: newReport.completedTasks,
          status: newReport.status,
          note: newReport.note,
          createdAt: newReport.createdAt,
        };
        setReports([...reports, todayReport]);
      } else {
        // Update existing report
        const currentTasks = todayReport.completedTasks || [];
        const updatedTasks = isCompleted
          ? currentTasks.filter(t => t !== taskName)
          : [...currentTasks, taskName];
        
        await dailyWorkReportService.updateDailyWorkReport(todayReport.id, {
          completedTasks: updatedTasks,
        });
        
        todayReport = {
          ...todayReport,
          completedTasks: updatedTasks,
        };
        setReports(reports.map(r => r.id === todayReport!.id ? todayReport! : r));
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      alert('Lỗi khi cập nhật công việc');
    }
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
            onClick={() => setShowReportForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Thêm Báo cáo
          </button>
        </div>
      </div>

      {/* Work Tasks List */}
      {workTasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">Chưa có công việc nào được setup</p>
          <p className="text-sm text-gray-500">Vui lòng vào tab "Setup công việc" để tạo công việc</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(tasksByCategory).map(category => (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
                {category}
              </h3>
              <div className="space-y-2">
                {tasksByCategory[category].map(task => {
                  const isCompleted = completedTaskIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${
                        isCompleted
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggleTaskComplete(task.id, task.taskName)}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${isCompleted ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                          {task.taskName}
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                        )}
                      </div>
                      {isCompleted && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
      {reports.filter(r => r.staffId === currentStaffId && r.reportDate === reportDate).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Báo cáo chi tiết</h3>
          <div className="space-y-3">
            {reports
              .filter(r => r.staffId === currentStaffId && r.reportDate === reportDate)
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
