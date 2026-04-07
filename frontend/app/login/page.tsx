'use client';

import Link from "next/link";
import { ArrowLeft, Gamepad2 } from "lucide-react";

export default function LoginPage() {
  const handleOAuthLogin = (provider: string) => {
    window.location.href = `http://localhost:8080/api/v1/auth/login/${provider}`;
  };

  return (
    <div className="game-page flex items-center justify-center p-6 relative overflow-hidden">

      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none animate-float" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-accent/8 blur-[120px] rounded-full pointer-events-none animate-float" style={{ animationDelay: '1s' }} />

      <main className="z-10 w-full max-w-md animate-bounce-in">
        {/* Game Card */}
        <div className="game-card p-8 space-y-6">
          <Link href="/" className="inline-flex items-center text-sm text-neutral-500 hover:text-primary transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Quay lại trang chủ
          </Link>

          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-500 rounded-2xl flex items-center justify-center mx-auto animate-float">
              <Gamepad2 size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Tham gia trò chơi</h1>
            <p className="text-neutral-500 text-sm">Đăng nhập để bắt đầu dự đoán và giành giải thưởng! 🎯</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleOAuthLogin('google')}
              className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white px-6 py-4 rounded-xl font-medium hover:bg-white/10 hover:border-primary/30 transition-all duration-300 group"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              <span className="group-hover:text-primary transition-colors">Tiếp tục với Google</span>
            </button>

            <button
              onClick={() => handleOAuthLogin('facebook')}
              className="w-full flex items-center justify-center gap-3 bg-[#1877F2]/20 border border-[#1877F2]/30 text-white px-6 py-4 rounded-xl font-medium hover:bg-[#1877F2]/30 transition-all duration-300"
            >
              <img src="https://www.svgrepo.com/show/448224/facebook.svg" alt="Facebook" className="w-5 h-5 invert" />
              Tiếp tục với Facebook
            </button>
          </div>

          <div className="text-center text-xs text-neutral-600 pt-2">
            Bằng việc đăng nhập, bạn đồng ý với <Link href="#" className="underline hover:text-primary">Điều khoản</Link> và <Link href="#" className="underline hover:text-primary">Chính sách bảo mật</Link> của chúng tôi.
          </div>
        </div>
      </main>
    </div>
  );
}
