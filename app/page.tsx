import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-black text-white px-4 overflow-hidden relative">
      
      {/* Dekoracyjne tło w stylu "grid" */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', size: '40px 40px', backgroundSize: '40px 40px' }}>
      </div>

      <div className="relative z-10 text-center max-w-4xl">
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-4 uppercase">
          Next Gen <span className="text-blue-500 text-glow">Performance</span>
        </h1>
        
        <p className="text-xl md:text-2xl font-light text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed">
          Precyzyjna analiza ruchu AI dedykowana dla 
          <span className="text-white font-bold"> Defensive Linemen</span>. 
          Mierz swój czas reakcji i dynamikę startu z dokładnością co do ułamków sekundy.
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <Link href="/drill" 
                className="group relative px-10 py-4 bg-white text-black font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-105">
            Zacznij Trening
            <span className="absolute -bottom-2 -right-2 w-full h-full border-2 border-blue-500 -z-10 group-hover:bottom-0 group-hover:right-0 transition-all"></span>
          </Link>

          <div className="flex flex-col items-start border-l-2 border-zinc-800 pl-6">
            <span className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Coming Soon</span>
            <span className="text-zinc-300 font-bold uppercase italic tracking-tight">
              Sprint Start Analysis 🏃‍♂️
            </span>
          </div>
        </div>
      </div>

      {/* Dolny pasek z "techem" */}
      <div className="absolute bottom-10 flex gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
        <span className="text-xs font-mono tracking-widest uppercase">MediaPipe AI</span>
        <span className="text-xs font-mono tracking-widest uppercase">Real-time Analytics</span>
        <span className="text-xs font-mono tracking-widest uppercase">Low Latency Engine</span>
      </div>
    </div>
  );
}