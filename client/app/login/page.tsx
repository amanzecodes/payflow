"use client";

import { useState, useEffect } from "react";

import PixelBlast from "@/components/PixelBlast";
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";

const ROTATING_TEXTS = [
  {
    title: "Know who paid.",
    subtitle: "The exact moment the transaction hits.",
    description: "Eliminate the waiting game. Every inbound bank transfer is automatically cross-referenced and linked to the rightful sender in real time.",
  },
  {
    title: "No more \"abeg confirm you don pay.\"",
    subtitle: "Kill the manual confirmation bottleneck.",
    description: "Stop chasing customers or members for payment screenshots. Let your platform handle validation silently in the background.",
  },
  {
    title: "No more manual paperwork.",
    subtitle: "Automate your ledger from end to end.",
    description: "Ditch the spreadsheets and paper receipt books. Keep your financial records perfectly organized without lifting a single finger.",
  },
  {
    title: "Stop guessing who paid.",
    subtitle: "Start knowing instantly.",
    description: "Designed for modern cooperatives, businesses, and platforms that require systemic trust, absolute data integrity, and low-latency tracking.",
  },
];

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Animation states for the copy rotation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState("out");
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % ROTATING_TEXTS.length);
        setFadeState("in");
      }, 500); // Duration of fade-out before swapping content
    }, 4500); // Total duration per item

    return () => clearInterval(interval);
  }, []);

  const validate = () => {
    if (!email) return "Please enter your email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email";
    if (!password) return "Please enter your password";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) return setError(v);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Login failed");
      }

      window.location.href = "/";
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-foreground">
      {/* Left Column: Animated Value Propositions */}
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

          {/* Top Brand Marker */}
          <div className="relative z-10">
            <span className="text-xs font-semibold tracking-widest text-[#5fa8ff] uppercase bg-[#0b79ff]/10 px-3 py-1.5 rounded-md border border-[#0b79ff]/20">
              Infrastructure
            </span>
          </div>

          {/* Core Animating Content Area */}
          <div className="relative z-10 max-w-lg my-auto min-h-[240px] flex flex-col justify-center">
            <div
              className={`transition-all duration-500 transform ease-in-out ${
                fadeState === "in"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2"
              }`}
            >
              <h2 className="text-4xl font-bold leading-tight tracking-tight mb-2 text-white">
                {ROTATING_TEXTS[currentIndex].title}
              </h2>
              <h3 className="text-2xl font-medium text-[#5fa8ff] mb-6 leading-snug">
                {ROTATING_TEXTS[currentIndex].subtitle}
              </h3>
              <p className="text-lg text-white/70 leading-relaxed font-normal">
                {ROTATING_TEXTS[currentIndex].description}
              </p>
            </div>
          </div>

          {/* Bottom Footnote / Product Meta */}
          <div className="relative z-10 border-t border-white/10 pt-6 flex items-center justify-between text-xs tracking-wide text-white/50 font-mono">
            <span>© PAYFLOW</span>
            <span>Nomba × DevCareer Hackathon</span>
          </div>
        </aside>
      </div>

      {/* Right Column: Clean Login Interface */}
      <div className="flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-8">
              <span className="font-bold text-xl tracking-tight text-foreground">Payflow</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Sign In</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Access your real-time payment reconciliation control panel.
            </p>
          </div>

          <form onSubmit={handleSubmit} aria-labelledby="login-heading">
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2"
              >
                Business Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
                  <HiOutlineMail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3.5 pl-11 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:shadow-[inset_0_0_0_2px_rgba(11,121,255,0.35)] focus:border-transparent transition-all"
                  placeholder="name@company.com"
                  aria-invalid={!!error}
                  required
                />
              </div>
            </div>

            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2"
              >
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
                  <HiOutlineLockClosed size={18} />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3.5 pl-11 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:shadow-[inset_0_0_0_2px_rgba(11,121,255,0.35)] focus:border-transparent transition-all"
                  placeholder="••••••••"
                  aria-invalid={!!error}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2.5 text-sm select-none cursor-pointer text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border accent-[#0b79ff]"
                />
                Remember this device
              </label>
              <a
                href="/forgot"
                className="text-sm font-medium text-[#0b79ff] hover:underline"
              >
                Forgot credentials?
              </a>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-lg bg-destructive/10 text-sm font-medium text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <div className="mb-6">
              <button
                type="submit"
                className="w-full cursor-pointer bg-[#0b79ff] hover:bg-[#0066de] text-white font-medium rounded-lg px-6 py-3.5 text-base transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Authenticating Session…" : "Secure Login"}
              </button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an infrastructure account?{" "}
              <a href="/signup" className="font-semibold text-foreground hover:underline">
                Register business
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;