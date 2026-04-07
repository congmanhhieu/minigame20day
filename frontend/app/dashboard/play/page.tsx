'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, Clock, CheckCircle2, ChevronRight, User as UserIcon, Zap, Target, Flame, Star, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { apiFetch } from '@/lib/api';

interface Question {
  id: number;
  question_text: string;
  options: string[];
}

export default function PlayPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [globalPrediction, setGlobalPrediction] = useState<number | ''>('');
  const [isSubbed, setIsSubbed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch('/game/questions/today'),
      apiFetch('/users/me')
    ]).then(([qRes, uRes]) => {
      if (qRes.status === 'success' && qRes.data) {
        setQuestions(qRes.data);
      } else {
        setQuestions([]);
      }

      if (uRes.status === 'success' && uRes.data?.history) {
        const sels: Record<number, number> = {};
        let pred: number | '' = '';
        let hasHistory = false;
        const todayStr = new Date().toISOString().split('T')[0];

        uRes.data.history.forEach((h: any) => {
          if (h.date === todayStr && h.question_id) {
            hasHistory = true;
            sels[h.question_id] = h.chosen_option_id || 0;
            pred = h.prediction || 0;
          }
        });

        if (hasHistory) {
          setIsSubbed(true);
          setSelections(sels);
          setGlobalPrediction(pred);
        }
      }
    }).catch(err => {
      console.error(err);
      setQuestions([]);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleOptionSelect = (qId: number, oIdx: number) => {
    setSelections(prev => ({ ...prev, [qId]: oIdx }));
  };

  const handleGlobalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const answers = questions.map(q => ({
        question_id: q.id,
        chosen_option_id: selections[q.id]
      }));

      const res = await apiFetch('/game/answers', {
        method: 'POST',
        body: JSON.stringify({
          answers,
          predicted_correct_count: Number(globalPrediction),
        }),
      });

      if (res.status === 'success') {
        setIsSubbed(true);
        // Scroll to top or show success toast
        window.scrollTo(0, 0);
      } else {
        alert(res.message || 'Lỗi khi nộp bài');
      }
    } catch {
      alert('Kết nối thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAnswered = questions.length > 0 && questions.every(q => selections[q.id] !== undefined);
  const canSubmit = allAnswered && globalPrediction !== '';

  return (
    <div className="game-page pb-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <header className="sticky top-0 z-50 bg-game-bg/80 backdrop-blur-xl border-b border-game-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1 font-bold">
            <ChevronLeft size={20} /> Quay lại
          </button>
          <div className="font-black text-xl tracking-tight flex items-center gap-2">
            <span className="shimmer-text uppercase">Thử thách hôm nay</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-500 text-sm">Đang tải câu hỏi...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="game-card p-12 text-center">
            <div className="text-6xl mb-4">😴</div>
            <p className="text-xl font-bold text-neutral-300">Hết câu hỏi rồi!</p>
            <button onClick={() => router.push('/dashboard')} className="mt-6 text-primary font-bold">Quay lại trang chính</button>
          </div>
        ) : (
          <div className="space-y-8">
            {isSubbed && (
              <div className="bg-primary/20 border border-primary/30 text-primary px-5 py-4 rounded-2xl flex items-start gap-4 animate-slide-up">
                <Trophy size={24} className="shrink-0 mt-0.5 text-primary" />
                <div>
                  <h3 className="font-black mb-1">Đã ghi nhận đáp án!</h3>
                  <p className="font-medium text-sm text-primary/80 leading-relaxed">
                    Kết quả dự đoán và điểm số sẽ được tự động tính vào cuối mỗi ngày. Cảm ơn bạn đã tham gia!
                  </p>
                </div>
              </div>
            )}
            {questions.map((q, idx) => {
              return (
                <div key={q.id} className="game-card p-6 animate-slide-up relative overflow-hidden">
                  {isSubbed && (
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg">
                      ĐÃ CHỐT ✓
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-primary font-black text-lg">#{idx + 1}</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <p className="text-xl font-bold mb-6 text-white leading-relaxed">{q.question_text}</p>

                  <div className="space-y-3 mb-2">
                    {q.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        disabled={isSubbed}
                        onClick={() => handleOptionSelect(q.id, oIdx)}
                        className={`option-btn w-full text-left px-5 py-4 rounded-2xl flex items-center justify-between group
                          ${selections[q.id] === oIdx ? 'selected border-primary bg-primary/10' : 'border-white/5 bg-white/[0.02]'}
                          ${isSubbed ? 'opacity-60' : 'hover:border-primary/50'}
                        `}
                      >
                        <span className="font-semibold">{opt}</span>
                        {selections[q.id] === oIdx && <CheckCircle2 size={18} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Global Prediction Section */}
            <div className="game-card p-6 animate-slide-up mt-8">
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl mb-6">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-2">
                  Dự đoán số người trả lời đúng TẤT CẢ câu hỏi hôm nay
                </label>
                <input
                  type="number"
                  disabled={isSubbed}
                  value={globalPrediction}
                  onChange={(e) => setGlobalPrediction(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  placeholder="Nhập con số may mắn của bạn..."
                  className="w-full bg-transparent outline-none text-3xl font-black text-primary placeholder:text-neutral-700 disabled:opacity-50"
                  min="0"
                />
              </div>

              {!isSubbed && (
                <button
                  onClick={handleGlobalSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Target size={20} /> CHỐT TẤT CẢ ĐÁP ÁN</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
