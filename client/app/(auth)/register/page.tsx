"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";
import { toast } from "sonner";

import { AuthAside } from "@/components/auth/AuthAside";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { useRegister } from "@/hooks/auth/use-register";
import { getApiErrorMessage } from "@/lib/api/error";
import { useOnboardingStore } from "@/lib/store/onboarding.store";

const RegisterPage = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const register = useRegister();
  const resetOnboarding = useOnboardingStore((state) => state.reset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await register.mutateAsync({ name, email, phone: `+234${phone}`, password });
      resetOnboarding();
      toast.success("Account created! Setting up your workspace…");
      router.push("/onboarding");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Registration failed"));
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-foreground">
      <AuthAside>
        <h2 className="text-4xl font-bold leading-tight tracking-tight mb-2 text-white">
          Get paid with certainty.
        </h2>
        <h3 className="text-2xl font-medium text-[#5fa8ff] mb-6 leading-snug">
          Set up your reconciliation infrastructure in minutes.
        </h3>
        <p className="text-lg text-white/70 leading-relaxed font-normal">
          Create your business account and start matching every inbound transfer to the right
          sender automatically, in real time.
        </p>
      </AuthAside>

      <div className="flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-8">
              <span className="font-bold text-xl tracking-tight text-foreground">Payflow</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Create your account
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Set up your real-time payment reconciliation control panel.
            </p>
          </div>

          <form onSubmit={handleSubmit} aria-labelledby="register-heading">
            <div className="mb-5">
              <label
                htmlFor="name"
                className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
                  <HiOutlineUser size={18} />
                </span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3.5 pl-11 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:shadow-[inset_0_0_0_2px_rgba(11,121,255,0.35)] focus:border-transparent transition-all"
                  placeholder="Jane Doe"
                  aria-invalid={register.isError}
                  required
                />
              </div>
            </div>

            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2"
              >
                Email Address
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
                  aria-invalid={register.isError}
                  required
                />
              </div>
            </div>

            <div className="mb-5">
              <label
                htmlFor="phone"
                className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2"
              >
                Phone Number
              </label>
              <PhoneInput id="phone" value={phone} onChange={setPhone} invalid={register.isError} />
            </div>

            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2"
              >
                Password
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
                  placeholder="At least 8 characters"
                  aria-invalid={register.isError}
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <button
                type="submit"
                className="w-full cursor-pointer bg-[#0b79ff] hover:bg-[#0066de] text-white font-medium rounded-lg px-6 py-3.5 text-base transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={register.isPending}
              >
                {register.isPending ? "Creating account…" : "Register business"}
              </button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Already have an infrastructure account?{" "}
              <a href="/login" className="font-semibold text-foreground hover:underline">
                Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
