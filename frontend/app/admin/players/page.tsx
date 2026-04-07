'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Users, Search, Calendar, Trophy } from 'lucide-react';

interface LeaderboardEntry {
  user_id: number;
  name: string;
  total_score?: number;
  daily_score?: number;
}

export default function PlayersPage() {
  const [tab, setTab] = useState<'overall' | 'daily'>('overall');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const endpoint = tab === 'daily' ? `/leaderboard/daily?date=${date}` : '/leaderboard/overall';
    apiFetch(endpoint)
      .then(res => {
        if (res.status === 'success' && res.data) {
          setEntries(res.data);
        } else {
          setEntries([]);
        }
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [tab, date]);

  const filteredEntries = entries.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Người chơi & Kết quả</h1>
        <p className="text-neutral-500">Tra cứu điểm số bảng xếp hạng theo ngày hoặc tổng thể toàn chiến dịch.</p>
      </div>

      {/* Control Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab('overall')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'overall' ? 'bg-white dark:bg-neutral-800 text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Hạng Tổng
          </button>
          <button
            onClick={() => setTab('daily')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'daily' ? 'bg-white dark:bg-neutral-800 text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Hạng Ngày
          </button>
        </div>

        {tab === 'daily' && (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2 font-bold text-sm h-full outline-none focus:border-primary"
          />
        )}
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Header & Search */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Trophy size={18} /> Danh sách xếp hạng</h2>

          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">
              {search ? 'No players match your search.' : 'No ranking data available yet.'}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  <th className="px-6 py-4 w-20 text-center">Hạng</th>
                  <th className="px-6 py-4">Tên người chơi</th>
                  <th className="px-6 py-4">Điểm số</th>
                  <th className="px-6 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((e, index) => (
                  <tr key={e.user_id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 py-4 text-center font-bold text-neutral-500">#{index + 1}</td>
                    <td className="px-6 py-4 font-semibold flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs uppercase">
                        {e.name.charAt(0)}
                      </div>
                      {e.name}
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">{tab === 'daily' ? e.daily_score || 0 : e.total_score || 0} pts</td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-sm font-semibold text-neutral-400 hover:text-primary transition">View Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
