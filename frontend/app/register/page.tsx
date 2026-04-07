'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        router.push('/login');
      } else {
        setError(data.message || 'Đăng ký thất bại.');
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-page flex items-center justify-center p-6 relative min-h-screen overflow-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none animate-float" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-accent/8 blur-[120px] rounded-full pointer-events-none animate-float" style={{ animationDelay: '1s' }} />

      <main className="z-10 w-full max-w-md animate-bounce-in">
        <div className="game-card p-8 space-y-6">
          <Link href="/" className="inline-flex items-center text-sm text-neutral-500 hover:text-primary transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Quay lại trang chủ
          </Link>

          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-500 rounded-2xl flex items-center justify-center mx-auto animate-float">
              <UserPlus size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Tạo tài khoản</h1>
            <p className="text-neutral-500 text-sm">Điền thông tin để bắt đầu tham gia</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl font-medium">
                {error}
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-2">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition"
                placeholder="VD: Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition"
                placeholder="Nhập email của bạn"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-2">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition"
                placeholder="Tạo mật khẩu"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-4 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'ĐĂNG KÝ'}
            </button>
          </form>

          <div className="text-center text-sm text-neutral-500 pt-2 border-t border-white/5">
            Đã có tài khoản? <Link href="/login" className="text-primary font-bold hover:underline">Đăng nhập</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
