import PixelBlast from "@/components/PixelBlast";

export function AuthAside({ children }: { children: React.ReactNode }) {
  return (
    <div className="hidden md:flex items-stretch justify-center p-0">
      <aside className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-[#03203f] via-[#04356b] to-[#081a2b] p-16 flex flex-col justify-between text-white">
        <div className="absolute inset-0 opacity-60">
          <PixelBlast
            variant="circle"
            color="#0b79ff"
            pixelSize={4}
            patternScale={3}
            patternDensity={0.8}
            speed={0.4}
            edgeFade={0.6}
            enableRipples
          />
        </div>

        <div className="relative z-10">
          <span className="text-xs font-semibold tracking-widest text-[#5fa8ff] uppercase bg-[#0b79ff]/10 px-3 py-1.5 rounded-md border border-[#0b79ff]/20">
            Infrastructure
          </span>
        </div>

        <div className="relative z-10 max-w-lg my-auto min-h-[240px] flex flex-col justify-center">
          {children}
        </div>

        <div className="relative z-10 border-t border-white/10 pt-6 flex items-center justify-between text-xs tracking-wide text-white/50 font-mono">
          <span>© PAYFLOW</span>
          <span>Nomba × DevCareer Hackathon</span>
        </div>
      </aside>
    </div>
  );
}
