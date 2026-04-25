import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  generateAiPath,
  type AiPathGenerateResponse,
  type AiPathNode,
} from "@/services/aiPath";
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
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const DEPTH_OPTIONS = [
  { value: "quick", label: "Quick (2-3 stages)" },
  { value: "standard", label: "Standard (3-5 stages)" },
  { value: "deep", label: "Deep (5-7 stages)" },
];

const CONTENT_OPTIONS = [
  { value: "video", label: "Videos & Courses" },
  { value: "article", label: "Articles & Tutorials" },
  { value: "mixed", label: "Mix Both" },
];

function readLastResult(): AiPathGenerateResponse | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AiPathGenerateResponse) : null;
  } catch {
    return null;
  }
}

function stageDescription(node: AiPathNode) {
  return node.description || node.explanation || "No description yet.";
}

function nodeResourceCount(node: AiPathNode) {
  return (
    (node.resources?.length || 0) +
    (node.sub_nodes || []).reduce(
      (sum, subNode) => sum + (subNode.resources?.length || 0),
      0
    )
  );
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
      setLastResult(result);
      navigate("/ai-path-detail");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(String(err.response?.data?.detail || err.message || "AI Path generation failed"));
    } finally {
      setLoading(false);
    }
  }, [query, navigate, level, depth, contentType]);

  const previewNodes = lastResult?.data.nodes || [];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-100">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="max-w-2xl">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500 mb-4 block">
              AI Guided
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-stone-900 leading-tight">
              AI Path Generator
            </h1>
            <p className="mt-4 text-base text-stone-500 leading-relaxed">
              Enter your learning goal and let AI generate a structured learning path with stage descriptions, steps, and recommended resources.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main form */}
          <section className="lg:col-span-2 bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
                  Prompt
                </p>
                <h2 className="mt-1 text-lg font-semibold text-stone-900">
                  Describe what you want to learn
                </h2>
              </div>
              <Link
                to="/ai-path-detail"
                className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
              >
                View recent →
              </Link>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={6}
              maxLength={2000}
              placeholder="Example: I want to learn React full-stack development systematically, launch a production-ready project in 3 months..."
              className="w-full border border-stone-200 rounded-lg bg-stone-50 px-4 py-4 text-sm leading-relaxed text-stone-900 outline-none placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-50 transition-all"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuery(preset)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-500 transition-all hover:border-amber-300 hover:text-amber-600"
                >
                  {preset.length > 35 ? preset.slice(0, 35) + "..." : preset}
                </button>
              ))}
            </div>

            {/* Preferences */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as Level)}
                  className="w-full border border-stone-200 rounded-lg bg-white px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors cursor-pointer"
                >
                  {LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">Depth</label>
                <select
                  value={depth}
                  onChange={(e) => setDepth(e.target.value as Depth)}
                  className="w-full border border-stone-200 rounded-lg bg-white px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors cursor-pointer"
                >
                  {DEPTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">Format</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="w-full border border-stone-200 rounded-lg bg-white px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors cursor-pointer"
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
                className="bg-amber-500 text-white px-6 py-3 text-sm font-semibold rounded-lg hover:bg-amber-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              <p className="mt-4 text-sm text-red-500 font-medium">{error}</p>
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* How it works */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
                How it works
              </p>
              <div className="mt-4 space-y-4">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-3">
                      <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-stone-100 rounded-lg">
                        <Icon className="w-4 h-4 text-stone-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-stone-900">
                          {step.title}
                        </h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
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
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
                      Latest
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-stone-900 line-clamp-1">
                      {lastResult.data.title || "Latest AI Path"}
                    </h3>
                  </div>
                  <Link
                    to="/ai-path-detail"
                    className="text-xs font-medium text-amber-600 hover:text-amber-700"
                  >
                    Open →
                  </Link>
                </div>
                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-stone-500">
                  {lastResult.data.summary}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-stone-400">
                  <span>{lastResult.data.nodes?.length || 0} stages</span>
                </div>
              </section>
            )}
          </aside>
        </div>

        {/* Learning path preview */}
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 bg-amber-500 rounded-full" />
            <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
              Generated Path Preview
            </h2>
          </div>

          {previewNodes.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previewNodes.map((node, idx) => (
                <Link
                  key={`${idx}-${node.title}`}
                  to="/ai-path-detail"
                  className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-semibold">
                      {idx + 1}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                      Stage {idx + 1}
                    </span>
                  </div>
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
                    {node.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-stone-500">
                    {stageDescription(node)}
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-stone-400">
                    <span>{node.sub_nodes?.length || 0} topics</span>
                    <span>{nodeResourceCount(node)} resources</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 text-xs font-semibold">
                      {i}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                      Stage {i}
                    </span>
                  </div>
                  <div className="h-4 bg-stone-100 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-stone-50 rounded mb-4 w-full" />
                  <div className="flex items-center gap-2">
                    <div className="h-3 bg-stone-50 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
