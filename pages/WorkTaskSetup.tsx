/**
 * Work Task Setup Page
 * Setup công việc: Hạng mục, Tên công việc, Nhân sự thực hiện
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  CheckSquare,
  FolderOpen,
  Briefcase,
  Users
} from 'lucide-react';
import { useAuth } from '../src/hooks/useAuth';
import { useStaff } from '../src/hooks/useStaff';
import * as workTaskService from '../src/services/workTaskSupabaseService';
import type { WorkTask } from '../src/services/workTaskSupabaseService';

export const WorkTaskSetup: React.FC = () => {
  const { user, staffData } = useAuth();
  const { staff: staffList } = useStaff();
  
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkTask | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    taskName: '',
    staffIds: [] as string[],
    description: '',
    isActive: true,
  });

  // Load tasks
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workTaskService.getAllWorkTasks();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (task?: WorkTask) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        category: task.category,
        taskName: task.taskName,
        staffIds: task.staffIds,
        description: task.description || '',
        isActive: task.isActive,
      });
    } else {
      setEditingTask(null);
      setFormData({
        category: '',
        taskName: '',
        staffIds: [],
        description: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData({
      category: '',
      taskName: '',
      staffIds: [],
      description: '',
      isActive: true,
    });
  };

  const handleToggleStaff = (staffId: string) => {
    setFormData(prev => ({
      ...prev,
      staffIds: prev.staffIds.includes(staffId)
        ? prev.staffIds.filter(id => id !== staffId)
        : [...prev.staffIds, staffId],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.category.trim()) {
      alert('Vui lòng nhập hạng mục công việc');
      return;
    }
    if (!formData.taskName.trim()) {
      alert('Vui lòng nhập tên công việc');
      return;
    }
    if (formData.staffIds.length === 0) {
      alert('Vui lòng chọn ít nhất một nhân sự');
      return;
    }

    try {
      setLoading(true);
      
      // Get staff names
      const staffNames = formData.staffIds.map(id => {
        const staff = staffList.find(s => s.id === id);
        return staff?.name || '';
      }).filter(Boolean);

      // Debug: Log staff IDs being saved
      console.log('=== Saving work task ===');
      console.log('Selected staffIds:', formData.staffIds);
      console.log('Staff list:', staffList.map(s => ({ id: s.id, name: s.name, code: s.code })));
      formData.staffIds.forEach(staffId => {
        const staff = staffList.find(s => s.id === staffId);
        console.log(`  - Staff ID "${staffId}":`, staff ? `${staff.name} (${staff.code})` : 'NOT FOUND in staffList');
      });
      
      const taskData: Omit<WorkTask, 'id' | 'createdAt' | 'updatedAt'> = {
        category: formData.category.trim(),
        taskName: formData.taskName.trim(),
        staffIds: formData.staffIds,
        staffNames,
        description: formData.description.trim() || null,
        isActive: formData.isActive,
        createdBy: staffData?.name || user?.email || null,
      };
      
      console.log('Task data to save:', taskData);

      if (editingTask) {
        await workTaskService.updateWorkTask(editingTask.id, taskData);
      } else {
        await workTaskService.createWorkTask(taskData);
      }

      handleCloseModal();
      await fetchTasks();
      alert(editingTask ? 'Cập nhật công việc thành công!' : 'Tạo công việc thành công!');
    } catch (err) {
      console.error('Error saving task:', err);
      alert('Lỗi khi lưu công việc');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (task: WorkTask) => {
    if (!confirm(`Bạn có chắc muốn xóa công việc "${task.taskName}"?`)) return;
    
    try {
      await workTaskService.deleteWorkTask(task.id);
      await fetchTasks();
      alert('Xóa công việc thành công!');
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Lỗi khi xóa công việc');
    }
  };

  const handleToggleActive = async (task: WorkTask) => {
    try {
      await workTaskService.updateWorkTask(task.id, { isActive: !task.isActive });
      await fetchTasks();
    } catch (err) {
      console.error('Error toggling task:', err);
      alert('Lỗi khi cập nhật trạng thái');
    }
  };

  // Group tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, WorkTask[]>);

  const categories = Object.keys(tasksByCategory).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Setup Công việc
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Thêm Công việc
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && !tasks.length ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Chưa có công việc nào được setup</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Thêm công việc đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
                {category}
              </h3>
              <div className="space-y-3">
                {tasksByCategory[category].map(task => (
                  <div
                    key={task.id}
                    className={`p-4 border rounded-lg ${
                      task.isActive 
                        ? 'border-gray-200 bg-gray-50' 
                        : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{task.taskName}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              task.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {task.isActive ? 'Hoạt động' : 'Tạm dừng'}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">Nhân sự:</span>
                          <span>{task.staffNames.join(', ') || 'Chưa có'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(task)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                          title={task.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                        >
                          {task.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => handleOpenModal(task)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingTask ? 'Sửa Công việc' : 'Thêm Công việc'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hạng mục công việc <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Ví dụ: Marketing, Đào tạo, Hành chính..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên công việc <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.taskName}
                  onChange={(e) => setFormData(prev => ({ ...prev, taskName: e.target.value }))}
                  placeholder="Nhập tên công việc..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Mô tả chi tiết công việc (tùy chọn)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Nhân sự thực hiện <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {staffList.length === 0 ? (
                    <p className="text-gray-500 text-sm">Chưa có nhân sự</p>
                  ) : (
                    <div className="space-y-2">
                      {staffList.map(staff => (
                        <label
                          key={staff.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.staffIds.includes(staff.id)}
                            onChange={() => handleToggleStaff(staff.id)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-900">{staff.name}</span>
                          {staff.role && (
                            <span className="text-xs text-gray-500">({staff.role})</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.staffIds.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Đã chọn: {formData.staffIds.length} nhân sự
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Công việc đang hoạt động
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang lưu...' : editingTask ? 'Cập nhật' : 'Tạo mới'}
              </button>
              <button
                onClick={handleCloseModal}
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
