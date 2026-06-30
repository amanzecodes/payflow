"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineLockClosed } from "react-icons/hi";

import { AuthAside } from "@/components/auth/AuthAside";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { RotatingCopy } from "@/components/auth/RotatingCopy";
import { LOGIN_ROTATING_TEXTS } from "@/constants/auth.constants";
import { useLogin } from "@/hooks/auth/use-login";
import { getApiErrorMessage } from "@/lib/api/error";
import { validateLoginForm } from "@/lib/validation/auth.validation";

const LoginPage = () => {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useLogin({
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, "An unexpected error occurred"));
    },
  });

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validationError = validateLoginForm({ phone, password });
    if (validationError) return setError(validationError);

    login.mutate({ phone: `+234${phone}`, password, remember });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-foreground">
      <AuthAside>
        <RotatingCopy items={LOGIN_ROTATING_TEXTS} />
      </AuthAside>

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
                htmlFor="phone"
                className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2"
              >
                Business Phone Number
              </label>
              <PhoneInput id="phone" value={phone} onChange={setPhone} invalid={!!error} />
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
              <a href="/forgot" className="text-sm font-medium text-[#0b79ff] hover:underline">
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
                disabled={login.isPending}
              >
                {login.isPending ? "Authenticating Session…" : "Secure Login"}
              </button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an infrastructure account?{" "}
              <a href="/register" className="font-semibold text-foreground hover:underline">
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
