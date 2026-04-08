'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Medal, Crown, Star, Flame } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface LeaderboardEntry {
  user_id: number;
  name: string;
  avatar?: string;
  daily_score?: number;
  total_score?: number;
  score?: number;
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'daily' | 'overall'>('daily');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const nowICT = new Date(Date.now() + 7 * 3600000);
    const today = nowICT.toISOString().split('T')[0];
    const yesterday = new Date(nowICT.getTime() - 86400000).toISOString().split('T')[0];

    const endpoint = tab === 'daily'
      ? `/leaderboard/daily?date=${yesterday}`
      : '/leaderboard/overall';

    apiFetch(endpoint)
      .then(res => {
        if (res.status === 'success' && res.data) {
          setEntries(res.data.map((e: any) => ({
            ...e,
            score: e.daily_score || e.total_score || 0,
          })));
        } else {
          setEntries([]);
        }
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const getScore = (e: LeaderboardEntry) => e.daily_score || e.total_score || e.score || 0;
  const getMedalColor = (idx: number) => {
    if (idx === 0) return 'from-yellow-400 to-yellow-600';
    if (idx === 1) return 'from-neutral-300 to-neutral-500';
    return 'from-orange-400 to-orange-600';
  };

  return (
    <div className="game-page pb-20 relative overflow-hidden">
      <div className="absolute top-0 left-[20%] w-[30%] h-[20%] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-0 w-[25%] h-[25%] bg-primary/8 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-game-bg/80 backdrop-blur-xl border-b border-game-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-neutral-500 hover:text-primary transition-colors flex items-center gap-2 p-1">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-black text-xl flex items-center gap-2">
            <Trophy className="text-primary" size={22} /> Bảng xếp hạng
          </h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        {/* Tabs */}
        <div className="flex p-1 game-card rounded-xl mb-8">
          <button
            onClick={() => setTab('daily')}
            className={`flex-1 py-3 text-center rounded-lg font-bold text-sm transition-all ${tab === 'daily'
              ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg'
              : 'text-neutral-500 hover:text-white'
              }`}
          >
            🔥 Top hôm qua
          </button>
          <button
            onClick={() => setTab('overall')}
            className={`flex-1 py-3 text-center rounded-lg font-bold text-sm transition-all ${tab === 'overall'
              ? 'bg-gradient-to-r from-accent to-purple-500 text-white shadow-lg'
              : 'text-neutral-500 hover:text-white'
              }`}
          >
            👑 Tổng
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="game-card p-12 text-center animate-bounce-in">
            <div className="text-5xl mb-4">🏜️</div>
            <p className="text-lg font-bold text-neutral-300">Chưa có xếp hạng</p>
            <p className="text-neutral-500 mt-1 text-sm">Hãy là người đầu tiên chơi và chiếm lĩnh vị trí đầu bảng!</p>
          </div>
        ) : (
          <div className="animate-slide-up">
            {/* Podium */}
            <div className="flex justify-center items-end gap-3 mb-10 mt-8">
              {/* 2nd place */}
              {entries[1] && (
                <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: '200ms' }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-neutral-300 to-neutral-500 rounded-full mb-3 flex items-center justify-center font-black text-2xl text-white shadow-lg">
                    {entries[1].name.charAt(0)}
                  </div>
                  <div className="w-22 h-24 bg-white/5 border border-white/10 flex flex-col items-center justify-start pt-3 rounded-t-xl relative">
                    <Medal size={20} className="text-neutral-400 mb-1" />
                    <span className="font-bold text-sm truncate w-full text-center px-1">{entries[1].name}</span>
                    <span className="text-xs text-neutral-500 font-semibold">{getScore(entries[1])} điểm</span>
                  </div>
                </div>
              )}

              {/* 1st place */}
              {entries[0] && (
                <div className="flex flex-col items-center z-10 animate-bounce-in">
                  <div className="relative">
                    <Crown size={24} className="text-yellow-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-float" />
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-3 flex items-center justify-center font-black text-3xl text-white shadow-[0_0_30px_rgba(250,204,21,0.4)]">
                      {entries[0].name.charAt(0)}
                    </div>
                  </div>
                  <div className="w-26 h-32 bg-primary/10 border border-primary/30 flex flex-col items-center justify-start pt-3 rounded-t-xl relative">
                    <Trophy size={28} className="text-primary mb-1 drop-shadow-md" />
                    <span className="font-black text-primary text-sm truncate w-full text-center px-1">{entries[0].name}</span>
                    <span className="text-sm text-primary font-bold">{getScore(entries[0])} điểm</span>
                  </div>
                </div>
              )}

              {/* 3rd place */}
              {entries[2] && (
                <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: '400ms' }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mb-3 flex items-center justify-center font-black text-2xl text-white shadow-lg">
                    {entries[2].name.charAt(0)}
                  </div>
                  <div className="w-22 h-20 bg-white/5 border border-white/10 flex flex-col items-center justify-start pt-3 rounded-t-xl relative">
                    <Medal size={20} className="text-orange-400 mb-1" />
                    <span className="font-bold text-sm truncate w-full text-center px-1">{entries[2].name}</span>
                    <span className="text-xs text-neutral-500 font-semibold">{getScore(entries[2])} pts</span>
                  </div>
                </div>
              )}
            </div>

            {/* List */}
            <div className="game-card overflow-hidden">
              {entries.length <= 3 && (
                <div className="p-8 text-center text-neutral-600 text-sm">
                  Chưa có thêm thứ hạng nào khác!
                </div>
              )}
              {entries.slice(3).map((entry, index) => (
                <div
                  key={entry.user_id}
                  className="flex items-center justify-between px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors animate-slide-up"
                  style={{ animationDelay: `${(index + 3) * 80}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 text-center font-bold text-neutral-600 text-sm">#{index + 4}</span>
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-neutral-400">
                      {entry.name.charAt(0)}
                    </div>
                    <span className="font-semibold">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    {getScore(entry)} <Star size={14} className="text-yellow-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
