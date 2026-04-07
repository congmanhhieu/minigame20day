'use client';

import { useState } from 'react';
import { Settings, BarChart2, CheckSquare } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Bảng điều khiển tổng quan</h1>
        <p className="text-neutral-500">Quản lý cấu hình chiến dịch minigame 20 ngày của bạn tại đây.</p>
      </div>

      {/* Action Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <BarChart2 size={24} />
          </div>
          <p className="text-neutral-500 text-sm font-medium">Tổng số người chơi</p>
          <p className="text-3xl font-bold mt-1">—</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
            <CheckSquare size={24} />
          </div>
          <p className="text-neutral-500 text-sm font-medium">Tổng dự đoán hôm nay</p>
          <p className="text-3xl font-bold mt-1">—</p>
        </div>

      </div>

      {/* Config Mock View */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
          <h2 className="font-bold text-lg flex items-center gap-2"><Settings size={18} className="text-neutral-400" /> Cấu hình Minigame hiện tại</h2>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Đang chạy</span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-neutral-500 mb-1">Tên chiến dịch</p>
            <p className="font-medium text-lg">Predict & Win - 20 Days Season 1</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 mb-1">Thời gian diễn ra</p>
            <p className="font-medium text-lg">Apr 1, 2026 - Apr 20, 2026</p>
          </div>
          <div className="col-span-full">
            <p className="text-sm text-neutral-500 mb-3">Chi tiết minigame hôm nay</p>
            <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
              <span className="font-medium">Câu hỏi đang hoạt động</span>
              <p className="text-sm text-neutral-500">Đã lên lịch cho hôm nay. Thời gian trả lời kết thúc lúc 23:59.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
