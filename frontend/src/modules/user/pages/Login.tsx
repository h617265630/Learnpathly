import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { login, googleLogin } from "@/services/auth";
import { useAuthStore } from "@/stores/auth";

const USERNAME_MIN = 3;
const USERNAME_MAX = 32;
const PASSWORD_MIN = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser, fetchProfile } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleClientId = String(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || ""
  ).trim();
  const googleEnabled = !!googleClientId;

  // Load remember preference from localStorage
  useEffect(() => {
    try {
      const local = (globalThis as any).localStorage;
      setRemember(local?.getItem?.("learnsmart_remember") === "1");
    } catch {
      setRemember(false);
    }
  }, []);

  const buildLoginErrors = useCallback(() => {
    const newErrors = { email: "", password: "" };
    const identifier = email.trim();
    if (!identifier) {
      newErrors.email = "Username or email is required";
    } else if (identifier.includes("@")) {
      if (!EMAIL_REGEX.test(identifier)) {
        newErrors.email = "Please enter a valid email address";
      }
    } else if (
      identifier.length < USERNAME_MIN ||
      identifier.length > USERNAME_MAX
    ) {
      newErrors.email = `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters`;
    }
    if (!password || !password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < PASSWORD_MIN) {
      newErrors.password = `Password must be at least ${PASSWORD_MIN} characters`;
    } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      newErrors.password = "Password must include both letters and numbers";
    }
    return newErrors;
  }, [email, password]);

  const isFormValid = (() => {
    const newErrors = buildLoginErrors();
    return !newErrors.email && !newErrors.password;
  })();

  const syncTouchedErrors = useCallback(() => {
    const newErrors = buildLoginErrors();
    setErrors({
      email: touched.email ? newErrors.email : "",
      password: touched.password ? newErrors.password : "",
    });
  }, [buildLoginErrors, touched.email, touched.password]);

  useEffect(() => {
    syncTouchedErrors();
  }, [syncTouchedErrors]);

  const onBlur = (field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onFocus = (field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setTouched({ email: true, password: true });

    const newErrors = buildLoginErrors();
    setErrors(newErrors);
    if (newErrors.email || newErrors.password) return;

    setLoading(true);
    try {
      const res = await login({ username: email.trim(), password });
      const token = (res as any)?.access_token;
      if (!token)
        throw new Error("Login response did not include access_token");

      setToken(token, remember);
      try {
        const userData = await fetchProfile(true);
        if (userData) {
          setUser(userData, remember);
        } else {
          const fallbackUser = (res as any)?.user;
          if (fallbackUser) setUser(fallbackUser, remember);
        }
      } catch (profileError) {
        console.warn("Failed to sync user profile:", profileError);
      }
      navigate("/my-paths");
    } catch {
      setFormError("Invalid username/email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setFormError("");
    setGoogleLoading(true);
    try {
      const res = await googleLogin({ id_token: idToken });
      const token = (res as any)?.access_token;
      if (!token)
        throw new Error("Google login response did not include access_token");
      setToken(token, remember);
      try {
        const userData = await fetchProfile(true);
        if (userData) {
          setUser(userData, remember);
        } else {
          const fallbackUser = (res as any)?.user;
          if (fallbackUser) setUser(fallbackUser, remember);
        }
      } catch (profileError) {
        console.warn("Failed to sync user profile:", profileError);
      }
      navigate("/my-paths");
    } catch {
      setFormError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Initialize Google Sign-In
  useEffect(() => {
    if (!googleEnabled) return;
    const g = (globalThis as any).google;
    if (!g?.accounts?.id) return;
    if (!googleButtonRef.current) return;

    g.accounts.id.initialize({
      client_id: googleClientId,
      callback: (resp: any) => {
        const credential = String(resp?.credential || "").trim();
        if (!credential) return;
        void handleGoogleCredential(credential);
      },
    });
    g.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      width: Math.min(360, window.innerWidth - 32),
    });
  }, [googleEnabled, googleClientId]);

  const getInputBorderColor = (field: "email" | "password") => {
    if (touched[field] && !errors[field]) return "bg-emerald-400";
    if (errors[field]) return "bg-red-400";
    return "bg-stone-200";
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left editorial panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-stone-950 relative overflow-hidden flex-col justify-between p-12 xl:p-16">
        {/* Decorative large index */}
        <div className="absolute -right-8 -top-8 text-[20rem] xl:text-[24rem] font-black text-white/5 leading-none select-none pointer-events-none font-serif tracking-tight">
          01
        </div>

        {/* Accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />

        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500 mb-6">
            Learnpathly
          </p>
          <h1 className="text-5xl xl:text-6xl font-black text-white leading-[0.9] tracking-tight font-serif">
            Sign
            <br />
            in.
          </h1>
          <p className="mt-6 text-stone-400 text-sm leading-relaxed max-w-xs">
            Access your personal library, track progress, and continue building
            your knowledge.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-amber-500" />
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
              Personal learning platform
            </p>
          </div>
          <p className="text-xs text-stone-600">
            Build structured paths · Track progress · Turn scattered resources
            into lasting knowledge
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 xl:px-24 bg-stone-50/50">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 mb-2">
            Learnpathly
          </p>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight font-serif">
            Sign in.
          </h1>
        </div>

        <div className="w-full max-w-sm mx-auto lg:mx-0">
          {/* Form masthead */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-500 mb-2">
              Account
            </p>
            <h2 className="text-2xl font-black text-stone-900 font-serif tracking-tight leading-tight">
              Welcome back.
            </h2>
            <p className="mt-2 text-xs text-stone-400">
              Sign in to continue to Learnpathly
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identity fields */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold uppercase tracking-[0.15em] text-stone-500 mb-2"
                >
                  Username or Email
                </label>
                <div className="relative">
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 ${getInputBorderColor(
                      "email"
                    )}`}
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => onBlur("email")}
                    onFocus={() => onFocus("email")}
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={
                      errors.email ? "login-email-error" : undefined
                    }
                    className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && (
                  <p
                    id="login-email-error"
                    className="mt-1.5 text-xs text-red-500"
                    role="alert"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-[0.15em] text-stone-500 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 ${getInputBorderColor(
                      "password"
                    )}`}
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => onBlur("password")}
                    onFocus={() => onFocus("password")}
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={
                      errors.password ? "login-password-error" : undefined
                    }
                    className="w-full pl-10 pr-12 py-3 bg-white border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="login-password-error"
                    className="mt-1.5 text-xs text-red-500"
                    role="alert"
                  >
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Options row */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-3.5 h-3.5 border-stone-300 rounded text-amber-500 focus:ring-amber-200"
                />
                <span className="text-xs text-stone-400">Remember me</span>
              </label>
              <a
                href="#"
                className="text-xs text-stone-400 hover:text-amber-600 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full py-3 bg-stone-900 text-white text-sm font-bold hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-px active:translate-y-0 tracking-wide"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>

            {formError && (
              <p className="text-xs text-red-500 text-center py-2 border border-red-100 bg-red-50 rounded">
                {formError}
              </p>
            )}
          </form>

          {/* Google sign-in */}
          {googleEnabled && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-stone-200" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
                  or
                </span>
                <div className="flex-1 h-px bg-stone-200" />
              </div>
              <div ref={googleButtonRef} className="w-full" />
              {googleLoading && (
                <p className="text-xs text-stone-400 text-center mt-2">
                  Signing in with Google…
                </p>
              )}
            </div>
          )}

          {/* Sign up link */}
          <p className="mt-8 pt-6 border-t border-stone-100 text-center text-xs text-stone-400">
            Don't have an account?
            <Link
              to="/register"
              className="text-amber-600 hover:text-amber-700 font-semibold transition-colors"
            >
              {" "}
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
