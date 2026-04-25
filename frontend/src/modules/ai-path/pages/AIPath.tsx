import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { generateAiPath, type AiPathGenerateResponse } from "@/services/aiPath";
import { ArrowRight, Sparkles, FileText, Eye } from "lucide-react";

const STORAGE_KEY = "learnsmart_ai_path_result_v1";

const presets = [
  "I want to learn React full-stack development systematically and launch a production-ready project within 3 months",
  "I want to learn AI Agent development from scratch and build an app that can call tools",
  "I want to learn data analysis with focus on Python, Pandas, visualization, and real-world projects",
];

const steps = [
  { icon: FileText, title: "Enter Goal", text: "Tell AI your learning direction, current level, time commitment, and desired outcome." },
  { icon: Sparkles, title: "Generate Path", text: "AI calls LangChain to return a structured JSON learning path." },
  { icon: Eye, title: "View Details", text: "Check stage descriptions, step breakdowns, and recommended resources." },
];

type Level = "beginner" | "intermediate" | "advanced";
type Depth = "quick" | "standard" | "deep";
type ContentType = "video" | "article" | "mixed";

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner", color: "#16a34a" },
  { value: "intermediate", label: "Intermediate", color: "#ca8a04" },
  { value: "advanced", label: "Advanced", color: "#dc2626" },
];

const DEPTH_OPTIONS = [
  { value: "quick", label: "Quick (2-3 stages)", color: "#2563eb" },
  { value: "standard", label: "Standard (3-5 stages)", color: "#7c3aed" },
  { value: "deep", label: "Deep (5-7 stages)", color: "#0891b2" },
];

const CONTENT_OPTIONS = [
  { value: "video", label: "Videos & Courses", color: "#ea580c" },
  { value: "article", label: "Articles & Tutorials", color: "#7c3aed" },
  { value: "mixed", label: "Mix Both", color: "#16a34a" },
];

function readLastResult(): AiPathGenerateResponse | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AiPathGenerateResponse) : null;
  } catch {
    return null;
  }
}

export default function AIPath() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<AiPathGenerateResponse | null>(null);
  const [level, setLevel] = useState<Level>("beginner");
  const [depth, setDepth] = useState<Depth>("standard");
  const [contentType, setContentType] = useState<ContentType>("mixed");

  useEffect(() => {
    setLastResult(readLastResult());
  }, []);

  const handleSubmit = useCallback(async () => {
    const value = query.trim();
    if (!value) return;
    setLoading(true);
    setError("");
    try {
      const result = await generateAiPath(value, {
        level,
        learning_depth: depth,
        content_type: contentType,
      });
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      navigate("/ai-path-detail");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(String(err.response?.data?.detail || err.message || "AI Path generation failed"));
    } finally {
      setLoading(false);
    }
  }, [query, navigate, level, depth, contentType]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b-2 border-black bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid md:grid-cols-2 gap-8 items-end">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="h-1 w-8 bg-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-500">
                  AI Guided
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-black tracking-tight text-stone-900 leading-[0.95]">
                AI Path
                <br />
                <span className="text-purple-500">Generator.</span>
                <span className="text-xs font-bold text-stone-400 ml-3">beta</span>
              </h1>
            </div>
            <p className="text-sm leading-relaxed text-stone-500 max-w-md">
              Enter your learning goal and let AI generate a structured learning path.
              View stage descriptions, steps, and recommended resources.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main form */}
          <section className="lg:col-span-3 bg-white border-2 border-black rounded-memphis shadow-memphis p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                  Prompt
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-stone-900">
                  Describe what you want to learn
                </h2>
              </div>
              <Link
                to="/ai-path-detail"
                className="text-xs font-bold uppercase tracking-wider text-purple-500 hover:text-purple-600 transition-colors"
              >
                View recent →
              </Link>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={8}
              maxLength={2000}
              placeholder="Example: I want to learn React full-stack development systematically, launch a production-ready project in 3 months..."
              className="w-full border border-black rounded-memphis bg-stone-50 px-4 py-4 text-sm leading-relaxed text-stone-900 outline-none placeholder:text-stone-400 focus:border-purple-500 focus:bg-white transition-colors"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuery(preset)}
                  className="rounded-memphis border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-500 transition-all hover:border-purple-500 hover:text-purple-600"
                >
                  {preset.length > 40 ? preset.slice(0, 40) + "..." : preset}
                </button>
              ))}
            </div>

            {/* Preferences */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-stone-400 mb-2">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as Level)}
                  className="w-full border border-black rounded-memphis bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  {LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-stone-400 mb-2">Depth</label>
                <select
                  value={depth}
                  onChange={(e) => setDepth(e.target.value as Depth)}
                  className="w-full border border-black rounded-memphis bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  {DEPTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-stone-400 mb-2">Format</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="w-full border border-black rounded-memphis bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  {CONTENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-stone-400">
                Tip: Include your goal, time frame, current level, and desired outcome.
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !query.trim()}
                className="bg-purple-500 text-white px-6 py-3 text-sm font-black uppercase tracking-wider hover:bg-purple-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-black shadow-memphis rounded-memphis flex items-center gap-2"
              >
                {loading ? (
                  "Generating..."
                ) : (
                  <>
                    Generate
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-500 font-semibold">{error}</p>
            )}
          </section>

          {/* Sidebar */}
          <aside className="lg:col-span-2 space-y-5">
            {/* How it works */}
            <section className="bg-white border-2 border-black rounded-memphis shadow-memphis p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                How it works
              </p>
              <div className="mt-4 space-y-4">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const colors = ["#7c3aed", "#2563eb", "#16a34a"];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={step.title} className="flex gap-4">
                      <div
                        className="w-10 h-10 shrink-0 flex items-center justify-center border border-black rounded-memphis"
                        style={{ backgroundColor: color + "20" }}
                      >
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-stone-900">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-stone-500">
                          {step.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Last result */}
            {lastResult && (
              <section className="bg-white border-2 border-black rounded-memphis shadow-memphis p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                      Latest
                    </p>
                    <h3 className="mt-1 text-base font-black tracking-tight text-stone-900 line-clamp-1">
                      {lastResult.data.title || "Latest AI Path"}
                    </h3>
                  </div>
                  <Link
                    to="/ai-path-detail"
                    className="text-xs font-black uppercase tracking-wider text-purple-500 hover:text-purple-600"
                  >
                    Open →
                  </Link>
                </div>
                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-stone-500">
                  {lastResult.data.summary}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-stone-400">
                  <span>{lastResult.data.nodes?.length || 0} stages</span>
                  {lastResult.warnings?.length > 0 && (
                    <span>{lastResult.warnings.length} warnings</span>
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>

        {/* Learning path preview placeholder */}
        <section className="mt-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-1 h-6 bg-purple-500 rounded-full" />
            <h2 className="text-lg font-black text-stone-900 uppercase tracking-wider">
              Generated Path Preview
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border-2 border-black rounded-memphis shadow-memphis p-5 hover:shadow-memphis-lg hover:-translate-x-1 hover:-translate-y-1 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-memphis flex items-center justify-center text-white text-xs font-black border border-black"
                    style={{ backgroundColor: ["#7c3aed", "#2563eb", "#16a34a"][i - 1] }}
                  >
                    {i}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                    Stage {i}
                  </span>
                </div>
                <div className="h-4 bg-stone-100 rounded-memphis mb-2 w-3/4" />
                <div className="h-3 bg-stone-50 rounded-memphis mb-4 w-full" />
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-stone-100 rounded-memphis" />
                  <div className="h-3 bg-stone-50 rounded-memphis w-20" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}