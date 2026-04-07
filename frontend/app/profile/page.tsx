'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { apiFetch } from '@/lib/api';
import { ArrowLeft, LogOut, CheckCircle2, Trophy, Target, Flame, Star, Zap } from 'lucide-react';

interface HistoryEntry {
  answer_id: number;
  question: string;
  prediction: number;
  score: number;
  date: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/users/me')
      .then(res => {
        if (res.status === 'success' && res.data) {
          setHistory(res.data.history || []);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const totalScore = history.reduce((acc, h) => acc + h.score, 0);
  const perfectCount = history.filter(h => h.score === 100).length;
  const avgScore = history.length > 0 ? Math.round(totalScore / history.length) : 0;

  return (
    <div className="game-page pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[30%] h-[30%] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] left-0 w-[25%] h-[25%] bg-primary/8 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-game-bg/80 backdrop-blur-xl border-b border-game-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-neutral-500 hover:text-primary transition-colors p-1">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-black text-lg">Hồ sơ cá nhân</h1>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition-colors p-1" title="Log Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Player Card */}
        <div className="game-card p-6 animate-slide-up relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full pointer-events-none" />
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-orange-500 rounded-2xl flex items-center justify-center font-black text-3xl text-white shadow-[0_0_30px_rgba(249,115,22,0.3)] animate-float">
              {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <h2 className="text-2xl font-black">{user?.name || "Người chơi"}</h2>
              <p className="text-neutral-500 text-sm">Nhà dự đoán tài ba 🎯</p>
              <div className="mt-2 inline-flex items-center gap-2 bg-primary/15 text-primary px-4 py-1.5 rounded-full font-bold text-sm border border-primary/20">
                <Zap size={14} /> {user?.total_score || totalScore} XP
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="game-card p-4 text-center">
            <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Target size={18} className="text-primary" />
            </div>
            <p className="text-xl font-black text-primary">{history.length}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Dự đoán</p>
          </div>
          <div className="game-card p-4 text-center">
            <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Star size={18} className="text-green-400" />
            </div>
            <p className="text-xl font-black text-green-400">{perfectCount}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Hoàn hảo</p>
          </div>
          <div className="game-card p-4 text-center">
            <div className="w-10 h-10 bg-accent/15 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Flame size={18} className="text-accent" />
            </div>
            <p className="text-xl font-black text-accent">{avgScore}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Điểm TB</p>
          </div>
        </div>

        {/* History */}
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-lg font-black mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-primary" /> Lịch sử thi đấu
          </h3>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="game-card p-8 text-center">
              <div className="text-4xl mb-3">🎮</div>
              <p className="text-neutral-400 font-medium">Bạn chưa tham gia thử thách nào. Hãy bắt đầu ngay!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, idx) => (
                <div
                  key={item.answer_id}
                  className="game-card game-card-hover p-4 animate-slide-up"
                  style={{ animationDelay: `${(idx + 3) * 80}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-600 font-medium">{item.date}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black
                      ${item.score === 100
                        ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                        : item.score >= 70
                          ? 'bg-primary/15 text-primary border border-primary/20'
                          : 'bg-white/5 text-neutral-400 border border-white/10'
                      }`}>
                      {item.score === 100 ? '🎯 ' : ''}{item.score} điểm
                    </span>
                  </div>
                  <p className="font-semibold text-sm mb-2 text-neutral-200">{item.question}</p>
                  <div className="flex items-center gap-2 text-neutral-500 text-xs">
                    <CheckCircle2 size={14} className={item.score > 0 ? "text-primary" : "text-neutral-600"} />
                    Đã đoán: <span className="font-bold text-neutral-300">{item.prediction}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
