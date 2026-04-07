'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { HelpCircle, Plus, CopyPlus, Trash, Edit2, List, CalendarCheck } from 'lucide-react';

interface Question {
  id: number;
  question_text: string;
  options: string[];
  correct_option_id: number | null;
  active_date: string;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [activeDate, setActiveDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/admin/questions');
      if (res.status === 'success' && res.data) {
        setQuestions(res.data);
      } else if (res.status === 'error') {
        setError(res.message || 'Failed to fetch questions');
      }
    } catch (e) {
      console.error("Failed to fetch questions", e);
      setError('Connection error or unauthorized access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setQuestionText('');
    setOptions(['', '']);
    setCorrectOption(null);
    setActiveDate('');
  };

  const addOption = () => setOptions([...options, '']);
  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    const newOpts = [...options];
    newOpts.splice(idx, 1);
    setOptions(newOpts);
    if (correctOption === idx) setCorrectOption(null);
    else if (correctOption !== null && correctOption > idx) setCorrectOption(correctOption - 1);
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText || !activeDate) {
      alert("Vui lòng điền đủ thông tin bắt buộc!");
      return;
    }
    if (options.some(o => !o.trim())) {
      alert("Các lựa chọn không được để trống!");
      return;
    }

    setSubmitting(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/admin/questions/${editingId}` : '/admin/questions';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify({
          question_text: questionText,
          options: options,
          correct_option_id: correctOption,
          active_date: activeDate
        }),
      });

      if (res.status === 'success') {
        alert(editingId ? "Cập nhật câu hỏi thành công!" : "Thêm câu hỏi thành công!");
        resetForm();
        fetchQuestions();
      } else {
        alert("Lỗi: " + res.message);
      }
    } catch (error) {
      alert("Lỗi kết nối server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (q: Question) => {
    if (q.active_date < todayStr) {
      alert("Câu hỏi trong quá khứ không được phép sửa!");
      return;
    }
    setEditingId(q.id);
    setQuestionText(q.question_text);
    setOptions(q.options);
    setCorrectOption(q.correct_option_id);
    // Transform active_date to YYYY-MM-DD if needed (already is from backend usually)
    setActiveDate(q.active_date.split('T')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number, date: string) => {
    if (date < todayStr) {
      alert("Câu hỏi đã qua không được phép xóa!");
      return;
    }
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?")) return;

    try {
      const res = await apiFetch(`/admin/questions/${id}`, { method: 'DELETE' });
      if (res.status === 'success') {
        alert("Đã xóa câu hỏi!");
        fetchQuestions();
      } else {
        alert("Lỗi: " + res.message);
      }
    } catch (e) {
      alert("Lỗi kết nối");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Quản lý câu hỏi</h1>
          <p className="text-neutral-500 text-sm">Lên lịch và quản lý các thử thách dự đoán hàng ngày.</p>
        </div>
        {(editingId !== null) && (
          <button
            onClick={resetForm}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Hủy chỉnh sửa & Thêm mới
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Layer */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm p-6 sticky top-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-primary">
              {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
              {editingId ? "Sửa câu hỏi" : "Tạo thử thách mới"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">Ngày áp dụng</label>
                <input
                  required
                  type="date"
                  min={todayStr}
                  value={activeDate}
                  onChange={(e) => setActiveDate(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">Nội dung câu hỏi</label>
                <textarea
                  required
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Ví dụ: Giá ETH có vượt mức 5000$ tối nay không?"
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">Các lựa chọn trả lời</label>
                <div className="space-y-3">
                  {options.map((opt, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-neutral-400 text-xs">{String.fromCharCode(65 + idx)}</span>
                          <input
                            required
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-primary transition"
                            placeholder={`Option ${idx + 1}`}
                          />
                        </div>
                        {options.length > 2 && (
                          <button type="button" onClick={() => removeOption(idx)} className="p-2 text-neutral-400 hover:text-red-500 transition">
                            <Trash size={14} />
                          </button>
                        )}
                      </div>
                      <label className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase cursor-pointer ml-8">
                        <input
                          type="radio"
                          name="correctOpt"
                          checked={correctOption === idx}
                          onChange={() => setCorrectOption(idx)}
                          className="accent-primary w-3 h-3"
                        />
                        Đánh dấu là đáp án đúng
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addOption}
                  className="mt-4 flex items-center gap-2 text-xs text-primary font-bold hover:bg-primary/5 px-2 py-1.5 rounded-lg transition"
                >
                  <Plus size={14} /> Thêm lựa chọn
                </button>
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  disabled={submitting}
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : (editingId ? 'Cập nhật thử thách' : 'Phát hành thử thách')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List Layer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-neutral-500 mb-2">
            <List size={18} />
            <h2 className="font-bold">Các thử thách đã lên lịch ({questions.length})</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-neutral-500 text-sm">Đang đồng bộ câu hỏi...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-dashed border-red-200 dark:border-red-800/20">
              <p className="text-red-500 font-bold mb-2">Lỗi truy cập dữ liệu</p>
              <p className="text-neutral-500 text-sm mb-4">{error}</p>
              {error.includes('Unauthorized') || error.includes('unauthorized') || error.includes('header required') ? (
                <button onClick={() => window.location.href = '/login'} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-xs font-bold transition mx-auto block">
                  Đăng nhập quyền Admin
                </button>
              ) : (
                <button onClick={fetchQuestions} className="bg-neutral-200 hover:bg-neutral-300 px-4 py-2 rounded-lg text-xs font-bold transition mx-auto block">
                  Thử lại
                </button>
              )}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
              <HelpCircle size={40} className="mx-auto text-neutral-300 mb-3" />
              <p className="text-neutral-500">Chưa có câu hỏi nào. Hãy bắt đầu tạo mới!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => {
                const isPast = q.active_date.split('T')[0] < todayStr;
                const isToday = q.active_date.split('T')[0] === todayStr;

                return (
                  <div
                    key={q.id}
                    className={`bg-white dark:bg-neutral-900 border rounded-2xl p-5 transition-all shadow-sm group
                      ${isPast ? 'opacity-70 border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30' : 'border-neutral-200 dark:border-neutral-800 hover:border-primary/50'}
                    `}
                  >
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                              ${isPast ? 'bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700' :
                            isToday ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                              'bg-green-500/10 text-green-500 border-green-500/20'}
                            `}>
                          {isPast ? 'Hết hạn' : isToday ? 'Đang diễn ra' : 'Sắp tới'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400">
                          <CalendarCheck size={12} /> {q.active_date.split('T')[0]}
                        </div>
                      </div>

                      {!isPast && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(q)}
                            className="p-2 text-neutral-400 hover:text-primary transition rounded-lg hover:bg-primary/5"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(q.id, q.active_date.split('T')[0])}
                            className="p-2 text-neutral-400 hover:text-red-500 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-foreground mb-4 line-clamp-2">{q.question_text}</h3>

                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`text-xs p-2 rounded-lg border flex items-center justify-between
                              ${q.correct_option_id === oIdx
                              ? 'bg-green-500/5 border-green-500/20 text-green-600 font-bold'
                              : 'bg-neutral-50 dark:bg-neutral-950/50 border-neutral-100 dark:border-neutral-800 text-neutral-500'}
                            `}
                        >
                          <span className="truncate">{opt}</span>
                          {q.correct_option_id === oIdx && <span className="text-[10px] bg-green-500 text-white px-1.5 rounded uppercase">Đúng</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
