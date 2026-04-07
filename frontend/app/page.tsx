import Link from "next/link";
import { ArrowRight, Trophy, Flame, Zap, Target, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="game-page flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Animated background orbs */}
      <div className="absolute top-[-15%] left-[-5%] w-[40%] h-[40%] bg-primary/15 blur-[120px] rounded-full pointer-events-none animate-float" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[35%] h-[35%] bg-accent/15 blur-[120px] rounded-full pointer-events-none animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-[40%] right-[20%] w-[20%] h-[20%] bg-primary/10 blur-[80px] rounded-full pointer-events-none animate-float" style={{ animationDelay: '0.8s' }} />

      {/* Floating game icons */}
      <div className="absolute top-[15%] left-[10%] opacity-20 animate-float" style={{ animationDelay: '0.5s' }}>
        <Star size={40} className="text-primary" />
      </div>
      <div className="absolute top-[20%] right-[15%] opacity-15 animate-float" style={{ animationDelay: '1s' }}>
        <Target size={48} className="text-accent" />
      </div>
      <div className="absolute bottom-[25%] left-[15%] opacity-15 animate-float" style={{ animationDelay: '2s' }}>
        <Zap size={36} className="text-yellow-400" />
      </div>

      <main className="z-10 flex flex-col items-center max-w-2xl text-center space-y-8 animate-slide-up">
        {/* Badge */}
        <div className="flex items-center space-x-2 bg-primary/15 text-primary px-5 py-2.5 rounded-full border border-primary/30 font-semibold tracking-wide text-sm animate-pulse-glow">
          <Flame size={18} />
          <span>🔥 Thử thách 20 ngày đang diễn ra</span>
        </div>

        {/* Title */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter pb-2">
          <span className="shimmer-text">Dự đoán</span>
          <span className="text-white"> & </span>
          <span className="shimmer-text">Chiến thắng</span>
        </h1>

        <p className="text-lg md:text-xl text-neutral-400 max-w-lg leading-relaxed">
          Trả lời câu hỏi hàng ngày, dự đoán số người trả lời đúng và <span className="text-primary font-semibold">leo hạng</span>. Những người nhạy bén nhất sẽ giành quà khủng! 🏆
        </p>

        {/* Stats bar */}
        <div className="flex gap-6 text-center">
          <div className="game-card px-6 py-3">
            <p className="text-2xl font-bold text-primary">20</p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Ngày</p>
          </div>
          <div className="game-card px-6 py-3">
            <p className="text-2xl font-bold text-accent">∞</p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Dự đoán</p>
          </div>
          <div className="game-card px-6 py-3">
            <p className="text-2xl font-bold text-yellow-400">🏅</p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Quà tặng</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto">
          <Link
            href="/login"
            className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-orange-500 text-white px-10 py-5 w-full sm:w-auto rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105 animate-pulse-glow"
          >
            <span className="relative z-10 flex items-center gap-2">
              Bắt đầu chơi <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link
            href="/leaderboard"
            className="flex items-center justify-center gap-2 game-card game-card-hover text-white px-8 py-5 w-full sm:w-auto rounded-2xl font-semibold transition-all hover:scale-105"
          >
            <Trophy size={20} className="text-primary" /> Bảng xếp hạng
          </Link>
        </div>
      </main>
    </div>
  );
}
