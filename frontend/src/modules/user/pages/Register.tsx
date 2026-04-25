import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { register } from "@/services/auth";

const USERNAME_MIN = 3;
const USERNAME_MAX = 32;
const PASSWORD_MIN = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirm_password: false,
  });

  const buildFieldErrors = useCallback(() => {
    const errors = {
      username: "",
      email: "",
      password: "",
      confirm_password: "",
    };
    const trimmedUsername = form.username.trim();
    if (!trimmedUsername) {
      errors.username = "Username is required";
    } else if (
      trimmedUsername.length < USERNAME_MIN ||
      trimmedUsername.length > USERNAME_MAX
    ) {
      errors.username = `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters`;
    }
    const trimmedEmail = form.email.trim();
    if (!trimmedEmail) {
      errors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address";
    }
    const passwordValue = form.password;
    if (!passwordValue || !passwordValue.trim()) {
      errors.password = "Password is required";
    } else if (passwordValue.length < PASSWORD_MIN) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[A-Za-z]/.test(passwordValue) || !/\d/.test(passwordValue)) {
      errors.password = "Password must include both letters and numbers";
    }
    if (!form.confirm_password) {
      errors.confirm_password = "Please confirm your password";
    } else if (form.confirm_password !== form.password) {
      errors.confirm_password = "Passwords do not match";
    }
    return errors;
  }, [form.username, form.email, form.password, form.confirm_password]);

  const isFormValid = (() => {
    const errors = buildFieldErrors();
    return Object.values(errors).every((message) => !message) && agreedToTerms;
  })();

  const syncTouchedErrors = useCallback(() => {
    const errors = buildFieldErrors();
    setFieldErrors({
      username: touched.username ? errors.username : "",
      email: touched.email ? errors.email : "",
      password: touched.password ? errors.password : "",
      confirm_password: touched.confirm_password ? errors.confirm_password : "",
    });
  }, [
    buildFieldErrors,
    touched.username,
    touched.email,
    touched.password,
    touched.confirm_password,
  ]);

  useEffect(() => {
    syncTouchedErrors();
  }, [syncTouchedErrors]);

  const onBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onFocus = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleFieldChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const getInputBorderColor = (field: keyof typeof touched) => {
    if (touched[field] && !fieldErrors[field]) return "bg-emerald-400";
    if (fieldErrors[field]) return "bg-red-400";
    return "bg-stone-200";
  };

  const validateForm = () => {
    const errors = buildFieldErrors();
    setFieldErrors(errors);
    return Object.values(errors).every((message) => !message);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setTouched({
      username: true,
      email: true,
      password: true,
      confirm_password: true,
    });
    if (!validateForm() || !agreedToTerms) return;

    setLoading(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setSuccessMessage("Account created! Redirecting to sign in…");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err: any) {
      setFormError(
        err?.detail || err?.message || "Registration failed, please try again"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left editorial panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-stone-900 relative overflow-hidden flex-col justify-between p-12 xl:p-16">
        {/* Decorative large index */}
        <div className="absolute -right-8 -top-8 text-[20rem] xl:text-[24rem] font-black text-white/5 leading-none select-none pointer-events-none font-serif tracking-tight">
          02
        </div>

        {/* Accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />

        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400 mb-6">
            Learnpathly
          </p>
          <h1 className="text-5xl xl:text-6xl font-black text-white leading-[0.9] tracking-tight font-serif">
            Join
            <br />
            us.
          </h1>
          <p className="mt-6 text-stone-400 text-sm leading-relaxed max-w-xs">
            Start building your personal knowledge library. Turn scattered
            resources into structured learning paths.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-amber-400" />
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
              Free to start · No credit card
            </p>
          </div>
          <p className="text-xs text-stone-600">
            Join thousands of learners building structured knowledge
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
            Join us.
          </h1>
        </div>

        <div className="w-full max-w-sm mx-auto lg:mx-0">
          {/* Form masthead */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-500 mb-2">
              Account
            </p>
            <h2 className="text-2xl font-black text-stone-900 font-serif tracking-tight leading-tight">
              Create account.
            </h2>
            <p className="mt-2 text-xs text-stone-400">
              Free to start · No credit card required
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* Identity fields */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-bold uppercase tracking-[0.15em] text-stone-500 mb-2"
                >
                  Username
                </label>
                <div className="relative">
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 ${getInputBorderColor(
                      "username"
                    )}`}
                  />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                  <input
                    id="username"
                    type="text"
                    value={form.username}
                    onChange={handleFieldChange("username")}
                    onBlur={() => onBlur("username")}
                    onFocus={() => onFocus("username")}
                    aria-invalid={fieldErrors.username ? "true" : "false"}
                    aria-describedby={
                      fieldErrors.username
                        ? "register-username-error"
                        : undefined
                    }
                    className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                    placeholder="your_username"
                  />
                </div>
                {fieldErrors.username && (
                  <p
                    id="register-username-error"
                    className="mt-1.5 text-xs text-red-500"
                    role="alert"
                  >
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold uppercase tracking-[0.15em] text-stone-500 mb-2"
                >
                  Email
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
                    type="email"
                    value={form.email}
                    onChange={handleFieldChange("email")}
                    onBlur={() => onBlur("email")}
                    onFocus={() => onFocus("email")}
                    aria-invalid={fieldErrors.email ? "true" : "false"}
                    aria-describedby={
                      fieldErrors.email ? "register-email-error" : undefined
                    }
                    className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
                {fieldErrors.email && (
                  <p
                    id="register-email-error"
                    className="mt-1.5 text-xs text-red-500"
                    role="alert"
                  >
                    {fieldErrors.email}
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
                    value={form.password}
                    onChange={handleFieldChange("password")}
                    onBlur={() => onBlur("password")}
                    onFocus={() => onFocus("password")}
                    aria-invalid={fieldErrors.password ? "true" : "false"}
                    aria-describedby={
                      fieldErrors.password
                        ? "register-password-error"
                        : undefined
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
                {fieldErrors.password && (
                  <p
                    id="register-password-error"
                    className="mt-1.5 text-xs text-red-500"
                    role="alert"
                  >
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-bold uppercase tracking-[0.15em] text-stone-500 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 ${getInputBorderColor(
                      "confirm_password"
                    )}`}
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirm_password}
                    onChange={handleFieldChange("confirm_password")}
                    onBlur={() => onBlur("confirm_password")}
                    onFocus={() => onFocus("confirm_password")}
                    aria-invalid={
                      fieldErrors.confirm_password ? "true" : "false"
                    }
                    aria-describedby={
                      fieldErrors.confirm_password
                        ? "register-confirm-error"
                        : undefined
                    }
                    className="w-full pl-10 pr-12 py-3 bg-white border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirm_password && (
                  <p
                    id="register-confirm-error"
                    className="mt-1.5 text-xs text-red-500"
                    role="alert"
                  >
                    {fieldErrors.confirm_password}
                  </p>
                )}
              </div>
            </div>

            {/* Terms + Submit */}
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-3.5 h-3.5 mt-0.5 border-stone-300 rounded text-amber-500 focus:ring-amber-200 cursor-pointer"
                />
                <label
                  htmlFor="terms"
                  className="text-xs text-stone-400 leading-relaxed cursor-pointer"
                >
                  I agree to the
                  <Link
                    to="/about"
                    className="text-amber-600 hover:text-amber-700 font-medium"
                  >
                    {" "}
                    Terms of Service
                  </Link>
                  and
                  <Link
                    to="/about"
                    className="text-amber-600 hover:text-amber-700 font-medium"
                  >
                    {" "}
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full py-3 bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-px active:translate-y-0 tracking-wide"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>

              {formError && (
                <p className="text-xs text-red-500 text-center py-2 border border-red-100 bg-red-50 rounded">
                  {formError}
                </p>
              )}
              {successMessage && (
                <p className="text-xs text-emerald-600 text-center py-2 border border-emerald-100 bg-emerald-50 rounded font-medium">
                  {successMessage}
                </p>
              )}
            </div>
          </form>

          {/* Sign in link */}
          <p className="mt-8 pt-6 border-t border-stone-100 text-center text-xs text-stone-400">
            Already have an account?
            <Link
              to="/login"
              className="text-amber-600 hover:text-amber-700 font-semibold transition-colors"
            >
              {" "}
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
