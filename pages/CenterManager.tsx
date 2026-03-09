/**
 * Center Manager Page
 * Quản lý các cơ sở của trung tâm
 */

import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Building2, AlertCircle, CheckCircle, X, MapPin, Phone, Mail } from 'lucide-react';
import { useCenters } from '../src/hooks/useCenters';
import type { Center } from '../src/services/centerService';

interface CenterFormData {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  status: 'Hoạt động' | 'Tạm dừng';
  notes: string;
}

export const CenterManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CenterFormData>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    status: 'Hoạt động',
    notes: '',
  });

  const { centers, loading, error, createCenter, updateCenter, deleteCenter } = useCenters();

  // Filter centers based on search
  const filteredCenters = useMemo(() => {
    if (!searchTerm) return centers;
    const searchLower = searchTerm.toLowerCase();
    return centers.filter(center =>
      center.name.toLowerCase().includes(searchLower) ||
      (center.code && center.code.toLowerCase().includes(searchLower)) ||
      (center.address && center.address.toLowerCase().includes(searchLower)) ||
      (center.phone && center.phone.includes(searchTerm))
    );
  }, [centers, searchTerm]);

  const handleOpenModal = (center?: Center) => {
    if (center) {
      setEditingCenter(center);
      setFormData({
        name: center.name,
        code: center.code || '',
        address: center.address || '',
        phone: center.phone || '',
        email: center.email || '',
        manager: center.manager || '',
        status: center.status,
        notes: center.notes || '',
      });
    } else {
      setEditingCenter(null);
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        manager: '',
        status: 'Hoạt động',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCenter(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      manager: '',
      status: 'Hoạt động',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const centerData: Partial<Center> = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        manager: formData.manager.trim() || undefined,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      };

      if (editingCenter) {
        await updateCenter(editingCenter.id, centerData);
      } else {
        await createCenter(centerData as Omit<Center, 'id' | 'createdAt' | 'updatedAt'>);
      }

      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving center:', error);
      alert(error.message || 'Không thể lưu cơ sở');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cơ sở này?')) {
      return;
    }

    try {
      await deleteCenter(id);
    } catch (error: any) {
      console.error('Error deleting center:', error);
      alert(error.message || 'Không thể xóa cơ sở');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={28} />
            Quản lý Cơ sở
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý thông tin các cơ sở của trung tâm</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm cơ sở..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            Thêm cơ sở
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Centers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">Đang tải...</p>
          </div>
        ) : filteredCenters.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'Không tìm thấy cơ sở nào' : 'Chưa có cơ sở nào. Nhấn "Thêm cơ sở" để bắt đầu.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCenters.map((center) => (
              <div
                key={center.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{center.name}</h3>
                    {center.code && (
                      <p className="text-xs text-gray-500 mb-2">Mã: {center.code}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      center.status === 'Hoạt động'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {center.status === 'Hoạt động' ? (
                      <CheckCircle size={12} />
                    ) : (
                      <AlertCircle size={12} />
                    )}
                    {center.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {center.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="flex-1">{center.address}</span>
                    </div>
                  )}
                  {center.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400 flex-shrink-0" />
                      <span>{center.phone}</span>
                    </div>
                  )}
                  {center.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400 flex-shrink-0" />
                      <span>{center.email}</span>
                    </div>
                  )}
                  {center.manager && (
                    <div className="text-gray-700">
                      <span className="font-medium">Quản lý: </span>
                      {center.manager}
                    </div>
                  )}
                </div>

                {center.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">{center.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleOpenModal(center)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Sửa"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(center.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
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
                  {editingCenter ? 'Sửa cơ sở' : 'Thêm cơ sở mới'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên cơ sở <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="VD: Cơ sở 1 - Quận 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã cơ sở
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="VD: CS01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nhập địa chỉ cơ sở"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="VD: 0901234567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="VD: cs1@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Người quản lý
                    </label>
                    <input
                      type="text"
                      value={formData.manager}
                      onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Tên người quản lý"
                    />
                  </div>

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
                      <option value="Tạm dừng">Tạm dừng</option>
                    </select>
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
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : editingCenter ? 'Cập nhật' : 'Thêm mới'}
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
