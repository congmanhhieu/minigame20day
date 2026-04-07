'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Clock, ChevronRight, User as UserIcon, Zap, Flame, Gift, Award, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { apiFetch } from '@/lib/api';

interface Prize {
  name: string;
  prize_type: string;
  description?: string;
}

interface Summary {
  correct_count: number;
  rank: number;
}

interface Question {
  id: number;
  question_text: string;
}

export default function Dashboard() {
  const startDateStr = process.env.NEXT_PUBLIC_START_DATE || new Date().toISOString().split('T')[0];
  const totalDays = parseInt(process.env.NEXT_PUBLIC_TOTAL_DAYS || '20');

  const start = new Date(startDateStr);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - start.getTime();
  let currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  if (currentDay < 1) currentDay = 1;
  if (currentDay > totalDays) currentDay = totalDays;
  const { user } = useAuthStore();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [todayQuestion, setTodayQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/game/prizes'),
      apiFetch('/game/summary/yesterday'),
      apiFetch('/game/questions/today')
    ]).then(([pRes, sRes, qRes]) => {
      if (pRes.status === 'success') setPrizes(pRes.data);
      if (sRes.status === 'success') setSummary(sRes.data);
      if (qRes.status === 'success' && qRes.data?.questions?.length > 0) setTodayQuestion(qRes.data.questions[0]);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const todayPrize = prizes.find(p => p.prize_type === 'daily');
  const grandPrize = prizes.find(p => p.prize_type === 'grand');

  return (
    <div className="game-page pb-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-game-bg/80 backdrop-blur-xl border-b border-game-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap size={16} className="text-white" />
            </div>
            <span className="shimmer-text">P&W</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/leaderboard" className="text-neutral-500 hover:text-primary transition-colors p-2 rounded-lg hover:bg-white/5">
              <Trophy size={20} />
            </Link>
            <Link href="/profile" className="w-9 h-9 bg-neutral-900 rounded-full flex items-center justify-center border border-white/5 hover:border-primary/30 transition-all overflow-hidden">
              <UserIcon size={16} className="text-neutral-500" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-8">
        {/* Welcome Section */}
        <section className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-2xl flex items-center justify-center border border-primary/20 shadow-2xl">
              <Flame size={32} className="text-primary animate-float" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Chào, {user?.name || 'Player'}!</h1>
              <p className="text-neutral-500 text-sm">Hôm nay hãy tiếp tục bứt phá nhé!</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="bg-game-card border border-game-border px-4 py-2 rounded-2xl flex items-center gap-2">
              <Calendar size={16} className="text-accent" />
              <span className="text-sm font-bold text-neutral-300">Ngày {currentDay}/{totalDays}</span>
            </div>
          </div>
        </section>

        {/* Prizes Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="game-card p-6 bg-gradient-to-br from-primary/10 to-transparent relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Gift size={80} />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">Giải thưởng thử thách hôm nay</span>
              <h2 className="text-xl font-black text-white mb-1">{todayPrize?.name || "Thưởng 500k"}</h2>
              <p className="text-neutral-500 text-xs mb-4">{todayPrize?.description || "Dành cho người dự đoán đúng nhất"}</p>
              <div className="w-full h-1 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/3" />
              </div>
            </div>
          </div>

          <div className="game-card p-6 bg-gradient-to-br from-accent/10 to-transparent relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Award size={80} />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-2 block">Giải chung cuộc</span>
              <h2 className="text-xl font-black text-white mb-1">{grandPrize?.name || "Special iPhone 16 Pro"}</h2>
              <p className="text-neutral-500 text-xs mb-4">{grandPrize?.description || "Dành cho người đứng đầu bảng xếp hạng"}</p>
              <div className="w-full h-1 bg-accent/20 rounded-full overflow-hidden">
                <div className="h-full bg-accent w-2/3" />
              </div>
            </div>
          </div>
        </section>

        {/* Yesterday's Summary */}
        <section className="game-card p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-emerald-500" />
            <h3 className="font-black text-sm uppercase tracking-widest text-neutral-400">Kết quả hôm qua</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-2xl font-black text-white">{summary?.correct_count || 0}</p>
              <p className="text-[10px] text-neutral-500 font-bold uppercase">Số câu đúng</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-white">{summary?.rank ? `#${summary.rank}` : '---'}</p>
              <p className="text-[10px] text-neutral-500 font-bold uppercase">Thứ hạng ngày</p>
            </div>
            <div className="col-span-2 space-y-1">
              <p className="text-xl font-black text-emerald-500">{summary?.rank === 1 ? "Đã nhận quà 🎁" : "Chưa có giải"}</p>
              <p className="text-[10px] text-neutral-500 font-bold uppercase">Giải thưởng</p>
            </div>
          </div>

          <Link href="/leaderboard" className="mt-8 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
            Xem bảng xếp hạng <ChevronRight size={16} />
          </Link>
        </section>

        {/* Today's Challenge Preview */}
        <section className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="game-card p-8 relative overflow-hidden ring-1 ring-primary/20 hover:ring-primary/40 transition-all">
            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl shadow-lg">
              🔥 Hôm nay
            </div>

            <div className="max-w-lg">
              <span className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 block">Thử thách mới</span>
              <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                {todayQuestion ? todayQuestion.question_text : "Sẵn sàng cho các câu hỏi tiếp theo chưa?"}
              </h2>
              <p className="text-neutral-500 text-sm mb-8 leading-relaxed">
                Tham gia trả lời câu hỏi mỗi ngày để tích điểm và giành lấy những phần quà hấp dẫn nhất.
              </p>

              <Link
                href="/dashboard/play"
                className="inline-flex items-center gap-3 bg-primary hover:bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all transform hover:translate-x-1 active:scale-95"
              >
                TRẢ LỜI NGAY <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
