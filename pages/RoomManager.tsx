import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Home, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Room } from '../types';
import { useRooms } from '../src/hooks/useRooms';
import { useCenters } from '../src/hooks/useCenters';

interface RoomFormData {
  name: string;
  type: 'Đào tạo' | 'Văn phòng' | 'Hội trường';
  capacity: number | '';
  status: 'Hoạt động' | 'Bảo trì';
  branch: string;
  notes: string;
}

export const RoomManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomFormData>({
    name: '',
    type: 'Đào tạo',
    capacity: '',
    status: 'Hoạt động',
    branch: '',
    notes: '',
  });
  const { rooms, loading, createRoom, updateRoom, deleteRoom } = useRooms();
  const { centers, loading: centersLoading } = useCenters();

  // Get center names for dropdown
  const centerNames = useMemo(() => {
    return centers
      .filter(c => c.status === 'Hoạt động')
      .map(c => c.name)
      .sort();
  }, [centers]);

  // Filter rooms based on search
  const filteredRooms = useMemo(() => {
    if (!searchTerm) return rooms;
    const searchLower = searchTerm.toLowerCase();
    return rooms.filter(room =>
      room.name.toLowerCase().includes(searchLower) ||
      (room.branch && room.branch.toLowerCase().includes(searchLower)) ||
      (room.notes && room.notes.toLowerCase().includes(searchLower))
    );
  }, [rooms, searchTerm]);

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        type: room.type,
        capacity: room.capacity || '',
        status: room.status,
        branch: room.branch || '',
        notes: room.notes || '',
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        type: 'Đào tạo',
        capacity: '',
        status: 'Hoạt động',
        branch: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setFormData({
      name: '',
      type: 'Đào tạo',
      capacity: '',
      status: 'Hoạt động',
      branch: '',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const roomData: Partial<Room> = {
        name: formData.name.trim(),
        type: formData.type,
        status: formData.status,
        branch: formData.branch.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        capacity: formData.capacity !== '' ? Number(formData.capacity) : undefined,
      };

      if (editingRoom) {
        await updateRoom(editingRoom.id, roomData);
      } else {
        await createRoom(roomData);
      }

      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving room:', error);
      alert(error.message || 'Không thể lưu phòng học');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng học này?')) {
      return;
    }

    try {
      await deleteRoom(id);
    } catch (error: any) {
      console.error('Error deleting room:', error);
      alert(error.message || 'Không thể xóa phòng học');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hệ thống quản lý trung tâm</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm nhanh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Room Management Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Home size={24} className="text-indigo-600" />
            Phòng học
          </h2>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            Thêm phòng học
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">Đang tải...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'Không tìm thấy phòng học nào' : 'Chưa có phòng học nào'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">STT</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">TÊN PHÒNG HỌC</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">LOẠI PHÒNG HỌC</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CƠ SỞ</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">GHI CHÚ</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">TRẠNG THÁI</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room, index) => (
                  <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-700">{index + 1}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{room.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{room.type}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{room.branch || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{room.notes || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          room.status === 'Hoạt động'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {room.status === 'Hoạt động' ? (
                          <CheckCircle size={12} />
                        ) : (
                          <AlertCircle size={12} />
                        )}
                        {room.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(room)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(room.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingRoom ? 'Sửa phòng học' : 'Thêm phòng học'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên phòng học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nhập tên phòng học"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại phòng học <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Đào tạo">Đào tạo</option>
                      <option value="Văn phòng">Văn phòng</option>
                      <option value="Hội trường">Hội trường</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sức chứa
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value === '' ? '' : Number(e.target.value) })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Số người"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Hoạt động">Hoạt động</option>
                      <option value="Bảo trì">Bảo trì</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cơ sở
                    </label>
                    <select
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">-- Chọn cơ sở --</option>
                      {centerNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    {centersLoading && (
                      <p className="text-xs text-gray-500 mt-1">Đang tải danh sách cơ sở...</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nhập ghi chú (nếu có)"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {editingRoom ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
