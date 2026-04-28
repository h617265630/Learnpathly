import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  generateAiPath,
  type AiPathGenerateResponse,
  type AiPathNode,
  type AiPathPreferences,
} from "@/services/aiPath";

type Level = NonNullable<AiPathPreferences["level"]>;
type Depth = NonNullable<AiPathPreferences["learning_depth"]>;
type ContentType = NonNullable<AiPathPreferences["content_type"]>;
type PracticalRatio = NonNullable<AiPathPreferences["practical_ratio"]>;

const examplePrompts = [
  "I want to learn data analysis with focus on Python, Pandas, visualization, and real-world projects",
  "I want to learn AI Agent development from scratch and build an app that can call tools",
  "I want to learn React full-stack development systematically and launch a production-ready project within 3 months",
];

function getErrorMessage(error: unknown) {
  const err = error as { response?: { data?: { detail?: string } }; message?: string };
  return String(err.response?.data?.detail || err.message || "Generation failed, please try again later");
}

function countSubNodes(nodes: AiPathNode[]) {
  return nodes.reduce((sum, node) => sum + (node.sub_nodes?.length || 0), 0);
}

export default function AiOutlineGenerator() {
  const [topic, setTopic] = useState(examplePrompts[0]);
  const [level, setLevel] = useState<Level>("beginner");
  const [depth, setDepth] = useState<Depth>("standard");
  const [contentType, setContentType] = useState<ContentType>("mixed");
  const [practicalRatio, setPracticalRatio] = useState<PracticalRatio>("balanced");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiPathGenerateResponse | null>(null);

  const nodes = result?.data.nodes || [];
  const projectId = result?.project_id;

  const summaryStats = useMemo(() => {
    return {
      sections: nodes.length,
      subNodes: countSubNodes(nodes),
      warnings: result?.warnings?.length || 0,
    };
  }, [nodes, result]);

  const handleGenerate = async () => {
    const value = topic.trim();
    if (!value || loading) return;

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await generateAiPath(value, {
        level,
        learning_depth: depth,
        content_type: contentType,
        practical_ratio: practicalRatio,
      });
      setResult(response);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
            AI Content Factory
          </p>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">
            AI Outline Generator
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Generate outline and sub_nodes for each node with AI, then save to database.
          </p>
        </div>

        {projectId ? (
          <Link
            to={`/ai-path-detail?project_id=${projectId}`}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
          >
            View Details
            <ExternalLink className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <section className="rounded-md border border-stone-200 bg-white">
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="text-base font-semibold text-stone-900">Generation Config</h2>
          <p className="mt-1 text-xs text-stone-500">
            This generates AI Path project drafts, saved to ai_path_projects, ai_path_sections, ai_path_subnodes.
          </p>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Topic
            </label>
            <textarea
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              rows={5}
              maxLength={2000}
              className="mt-2 w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-3 text-sm leading-6 text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-50"
              placeholder="Enter the learning path topic you want to generate..."
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setTopic(prompt)}
                  className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-amber-300 hover:text-amber-700"
                >
                  {prompt.length > 46 ? `${prompt.slice(0, 46)}...` : prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Level
              </span>
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value as Level)}
                className="mt-2 h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-amber-400"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Depth
              </span>
              <select
                value={depth}
                onChange={(event) => setDepth(event.target.value as Depth)}
                className="mt-2 h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-amber-400"
              >
                <option value="quick">Quick</option>
                <option value="standard">Standard</option>
                <option value="deep">Deep</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Content
              </span>
              <select
                value={contentType}
                onChange={(event) => setContentType(event.target.value as ContentType)}
                className="mt-2 h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-amber-400"
              >
                <option value="mixed">Mixed</option>
                <option value="article">Articles</option>
                <option value="video">Videos</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Practice
              </span>
              <select
                value={practicalRatio}
                onChange={(event) =>
                  setPracticalRatio(event.target.value as PracticalRatio)
                }
                className="mt-2 h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-amber-400"
              >
                <option value="balanced">Balanced</option>
                <option value="theory_first">Theory first</option>
                <option value="practice_first">Practice first</option>
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-6 text-stone-500">
              This will call the backend AI API and write to database. Generation usually takes 30-90 seconds.
            </p>
            <Button
              type="button"
              disabled={loading || !topic.trim()}
              onClick={handleGenerate}
              className="bg-amber-500 text-stone-950 hover:bg-amber-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate & Save
                </>
              )}
            </Button>
          </div>

          {loading ? (
            <div className="rounded-md border border-amber-100 bg-amber-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    Generating outline and sub_nodes
                  </p>
                  <p className="mt-1 text-xs leading-6 text-stone-600">
                    The backend will search for resources first, then let AI organize the learning outline, and finally write to database.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-red-100 bg-red-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Generation failed</p>
                  <p className="mt-1 text-xs leading-6 text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {result ? (
        <section className="rounded-md border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-base font-semibold text-stone-900">
                    Generated & Saved
                  </h2>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Project ID: {projectId || "-"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-stone-600">
                <span className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1">
                  {summaryStats.sections} chapters
                </span>
                <span className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1">
                  {summaryStats.subNodes} knowledge points
                </span>
                <span className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1">
                  {summaryStats.warnings} messages
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div>
              <h3 className="text-xl font-bold text-stone-900">
                {result.data.title}
              </h3>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-stone-600">
                {result.data.summary || result.data.description}
              </p>
            </div>

            {result.warnings?.length ? (
              <div className="flex flex-wrap gap-2">
                {result.warnings.map((warning, index) => (
                  <span
                    key={`${warning}-${index}`}
                    className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-600"
                  >
                    {warning}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="space-y-4">
              {nodes.map((node, index) => (
                <article
                  key={`${node.title}-${index}`}
                  className="rounded-md border border-stone-200 bg-stone-50"
                >
                  <div className="border-b border-stone-200 px-4 py-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-stone-900 px-2 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">
                          {node.title}
                        </h4>
                        <p className="mt-1 text-xs leading-6 text-stone-600">
                          {node.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {node.sub_nodes?.length ? (
                    <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
                      {node.sub_nodes.map((subNode, subIndex) => (
                        <div
                          key={`${node.title}-${subNode.title}-${subIndex}`}
                          className="rounded-md border border-stone-200 bg-white px-4 py-3"
                        >
                          <p className="text-xs font-bold text-stone-900">
                            {index + 1}.{subIndex + 1} {subNode.title}
                          </p>
                          <p className="mt-1 text-xs leading-6 text-stone-600">
                            {subNode.description}
                          </p>
                          {subNode.learning_points?.length ? (
                            <ul className="mt-2 space-y-1">
                              {subNode.learning_points.slice(0, 4).map((point) => (
                                <li
                                  key={`${subNode.title}-${point}`}
                                  className="flex gap-2 text-xs leading-5 text-stone-600"
                                >
                                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
