'use client';

import { useState, useEffect } from 'react';
import { Gift, Plus, Trash2, Edit2, Package, Award, ChevronLeft, List } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Prize {
  id: number;
  program_id: number;
  date: string | null;
  name: string;
  description: string;
  prize_type: string;
}

export default function AdminPrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [prizeType, setPrizeType] = useState('daily');

  useEffect(() => {
    fetchPrizes();
  }, []);

  const fetchPrizes = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/prizes');
      if (res.status === 'success') {
        setPrizes(res.data || []);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Kết nối thất bại');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setDate('');
    setPrizeType('daily');
  };

  const handleEdit = (p: Prize) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description || '');
    setDate(p.date ? p.date.split('T')[0] : '');
    setPrizeType(p.prize_type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giải thưởng này?')) return;
    try {
      const res = await apiFetch(`/admin/prizes/${id}`, { method: 'DELETE' });
      if (res.status === 'success') {
        fetchPrizes();
      }
    } catch (err) {
      alert('Xóa thất bại');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      name,
      description,
      date: prizeType === 'daily' ? date : null,
      prize_type: prizeType,
    };

    try {
      const res = await apiFetch(editingId ? `/admin/prizes/${editingId}` : '/admin/prizes', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      if (res.status === 'success') {
        resetForm();
        fetchPrizes();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Lỗi hệ thống');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Quản lý giải thưởng</h1>
          <p className="text-neutral-500 text-sm">Thiết lập các phần quà hấp dẫn cho người chơi hàng ngày và giải chung cuộc.</p>
        </div>
        {editingId !== null && (
          <button onClick={resetForm} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            <ChevronLeft size={16} /> Quay lại thêm mới
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm p-6 sticky top-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-primary">
              {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
              {editingId ? "Sửa giải thưởng" : "Thêm giải thưởng"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">Loại giải thưởng</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrizeType('daily')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${prizeType === 'daily' ? 'bg-primary text-white border-primary' : 'bg-transparent text-neutral-500 border-neutral-200 hover:border-primary/50'} `}
                  >
                    Ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrizeType('grand')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${prizeType === 'grand' ? 'bg-accent text-white border-accent' : 'bg-transparent text-neutral-500 border-neutral-200 hover:border-accent/50'} `}
                  >
                    Chung cuộc
                  </button>
                </div>
              </div>

              {prizeType === 'daily' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">Ngày áp dụng</label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">Tên giải thưởng</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Voucher 500k"
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn gọn về giải thưởng..."
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-4 rounded-xl shadow-lg shadow-primary/20 transition disabled:opacity-50 active:scale-95"
              >
                {submitting ? 'Đang xử lý...' : (editingId ? 'Cập nhật giải thưởng' : 'Xác nhận thêm')}
              </button>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-neutral-500 px-2">
            <List size={18} />
            <h2 className="font-bold uppercase tracking-widest text-xs">Danh sách hiện có</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-neutral-500 text-sm font-medium">Đang lấy dữ liệu giải thưởng...</p>
            </div>
          ) : prizes.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl">
              <Package size={48} className="mx-auto text-neutral-200 mb-4" />
              <p className="text-neutral-500 font-medium">Bạn chưa cấu hình giải thưởng nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {prizes.map((p) => (
                <div key={p.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 hover:border-primary/30 transition-all group relative overflow-hidden">
                  <div className="flex items-start justify-between gap-4 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${p.prize_type === 'grand' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                        {p.prize_type === 'grand' ? <Award size={28} /> : <Gift size={28} />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter ${p.prize_type === 'grand' ? 'bg-accent text-white border-accent' : 'bg-primary text-white border-primary'}`}>
                            {p.prize_type === 'grand' ? 'Chung cuộc' : 'Ngày'}
                          </span>
                          {p.date && <span className="text-xs font-mono font-bold text-neutral-400">{p.date.split('T')[0]}</span>}
                        </div>
                        <h3 className="font-bold text-foreground text-lg leading-tight">{p.name}</h3>
                        <p className="text-neutral-500 text-sm line-clamp-2">{p.description || 'Chưa có mô tả chi tiết'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(p)} className="p-2.5 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  {/* Decorative background for grand prizes */}
                  {p.prize_type === 'grand' && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
