'use client';

import { Settings, Users, LayoutDashboard, HelpCircle, Gift } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (pathname !== '/admin/login') {
      if (!token || user?.role !== 'admin') {
        router.push('/admin/login');
      }
    }
  }, [pathname, token, user, router, mounted]);

  if (!mounted) return null;

  // Don't show sidebar on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navItems = [
    { name: "Bảng điều khiển", href: "/admin", icon: LayoutDashboard },
    { name: "Cấu hình câu hỏi", href: "/admin/questions", icon: HelpCircle },
    { name: "Quản lý giải thưởng", href: "/admin/prizes", icon: Gift },
    { name: "Người chơi & Kết quả", href: "/admin/players", icon: Users },
  ];

  return (
    <div className="admin-page min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <span className="font-bold text-xl tracking-tight text-primary">Quản trị viên</span>
        </div>

        <nav className="p-4 space-y-2 flex-grow overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const activeClasses = "bg-primary/10 text-primary font-medium";
            const inactiveClasses = "text-neutral-600 hover:bg-neutral-100 hover:text-foreground dark:text-neutral-400 dark:hover:bg-neutral-800";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? activeClasses : inactiveClasses}`}
              >
                <item.icon size={20} /> {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              router.push('/admin/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold transition"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
