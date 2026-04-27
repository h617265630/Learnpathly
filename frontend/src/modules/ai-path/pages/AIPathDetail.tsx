import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { AlertCircle, ChevronDown, Loader2 } from "lucide-react";
import type {
  AiPathGenerateResponse,
  AiPathNode,
  AiPathResourceLink,
} from "@/services/aiPath";
import {
  getAiPathProject,
  getLatestAiPathProject,
  getSubNodeDetail,
  type SubNodeDetailResponse,
} from "@/services/aiPath";

const STORAGE_KEY = "learnsmart_ai_path_result_v1";

function readResult(): AiPathGenerateResponse | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AiPathGenerateResponse) : null;
  } catch {
    return null;
  }
}

function collectNodeResources(node: AiPathNode): AiPathResourceLink[] {
  const seen = new Set<string>();
  const links: AiPathResourceLink[] = [];
  for (const item of node.resources || []) {
    const url = String(item?.url || "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    links.push({ ...item, url });
  }
  return links;
}

function collectAllNodeResources(node: AiPathNode): AiPathResourceLink[] {
  const seen = new Set<string>();
  const links: AiPathResourceLink[] = [];

  for (const item of node.resources || []) {
    const url = String(item?.url || "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    links.push({ ...item, url });
  }

  for (const subNode of node.sub_nodes || []) {
    for (const item of subNode.resources || []) {
      const url = String(item?.url || "").trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      links.push({ ...item, url });
    }
  }

  return links;
}

function renderMarkdown(content: string): string {
  // Escape HTML first
  let html = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (```language\n code ```)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const highlightedCode = highlightSyntax(code.trim(), lang || 'text');
    return `<pre class="bg-stone-50 border border-stone-200 rounded-md p-4 overflow-x-auto text-xs my-4 font-mono"><code>${highlightedCode}</code></pre>`;
  });

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-stone-100 px-1.5 py-0.5 rounded text-xs text-stone-800 font-mono">$1</code>');

  // Headers (# ## ### #### ##### ######)
  html = html.replace(/^###### (.+)$/gm, '<h6 class="text-xs font-semibold text-stone-600 mt-4 mb-2">$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5 class="text-sm font-semibold text-stone-600 mt-4 mb-2">$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold text-stone-700 mt-4 mb-2">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-stone-800 mt-6 mb-3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-stone-900 mt-6 mb-4">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-stone-900 mt-6 mb-4">$1</h1>');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong class="font-semibold">$1</strong>');

  // Italic (*text* or _text_)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Unordered lists (- item or * item)
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-stone-700">$1</li>');
  html = html.replace(/^\* (.+)$/gm, '<li class="ml-4 text-sm text-stone-700">$1</li>');

  // Ordered lists (1. item)
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-sm text-stone-700">$1</li>');

  // Wrap consecutive li elements in ul
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    return `<ul class="list-disc list-inside space-y-1 my-3">${match}</ul>`;
  });

  // Paragraphs (double newline)
  html = html.replace(/\n\n/g, '</p><p class="text-sm text-stone-600 leading-7 my-3">');

  // Single newline to br
  html = html.replace(/\n/g, '<br/>');

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = `<p class="text-sm text-stone-600 leading-7 my-3">${html}</p>`;
  }

  return html;
}

function highlightSyntax(code: string, lang: string): string {
  // Simple syntax highlighting for common languages
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Keywords (blue)
  const keywords: Record<string, string[]> = {
    python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'with', 'as', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'async', 'await', 'yield', 'lambda', 'pass', 'break', 'continue'],
    javascript: ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof'],
    typescript: ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'interface', 'type', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'enum', 'implements', 'extends', 'private', 'public', 'protected'],
    default: ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'def', 'async', 'await', 'try', 'catch', 'new', 'this', 'true', 'false', 'null', 'None']
  };

  const langKeywords = keywords[lang.toLowerCase()] || keywords.default;

  let highlighted = escaped;

  // Highlight keywords
  for (const kw of langKeywords) {
    highlighted = highlighted.replace(
      new RegExp(`\\b(${kw})\\b`, 'g'),
      `<span class="text-blue-600 font-semibold">${kw}</span>`
    );
  }

  // Highlight strings (green) - single and double quotes
  highlighted = highlighted.replace(
    /(["'`])([^"'`]*)(["'`])/g,
    '<span class="text-green-600">$1$2$3</span>'
  );

  // Highlight comments (gray italic) - # for Python, // for JS
  if (lang === 'python') {
    highlighted = highlighted.replace(
      /(#.*)$/gm,
      '<span class="text-stone-400 italic">$1</span>'
    );
  } else {
    highlighted = highlighted.replace(
      /(\/\/.*)$/gm,
      '<span class="text-stone-400 italic">$1</span>'
    );
    highlighted = highlighted.replace(
      /(\/\*[\s\S]*?\*\/)/g,
      '<span class="text-stone-400 italic">$1</span>'
    );
  }

  // Highlight numbers (purple)
  highlighted = highlighted.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span class="text-purple-600">$1</span>'
  );

  // Highlight function calls
  highlighted = highlighted.replace(
    /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    '<span class="text-amber-600">$1</span>('
  );

  return highlighted;
}

function stageAnchor(node: AiPathNode, idx: number) {
  const base = String(node.title || `stage-${idx + 1}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `stage-${idx + 1}`;
}

function resourceHost(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host || "resource";
  } catch {
    return "resource";
  }
}

function resourceTitle(url: string) {
  try {
    const parsed = new URL(url);
    const last =
      parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname;
    return decodeURIComponent(last).replace(/[-_]/g, " ") || parsed.hostname;
  } catch {
    return url;
  }
}

function resourceDisplayTitle(resource: AiPathResourceLink) {
  return resource.title || resourceTitle(resource.url);
}

function resourceDisplaySummary(resource: AiPathResourceLink) {
  return resource.description || resource.summary || resource.url;
}

function resourceTypeLabel(url: string) {
  const lower = url.toLowerCase();
  if (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("bilibili.com")
  )
    return "video";
  if (
    lower.includes("docs.") ||
    lower.includes("/docs") ||
    lower.endsWith(".pdf")
  )
    return "document";
  if (lower.includes("github.com")) return "repo";
  return "article";
}

function resourceThumbnail(resource: AiPathResourceLink) {
  if (resource.image) return resource.image;
  const url = resource.url;
  const host = resourceHost(url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    host
  )}&sz=256`;
}

function getCategoryColor(category?: string) {
  const key =
    String(category || "")
      .trim()
      .toLowerCase() || "other";
  const palette = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
    "#f97316",
    "#84cc16",
  ];
  let hash = 0;
  for (let i = 0; i < key.length; i += 1)
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

async function copySummary(
  result: AiPathGenerateResponse | null,
  intro: string
) {
  if (!result) return;
  const text = `${result.data.title}\n\n${intro}`;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    window.prompt("Copy summary", text);
  }
}

export default function AIPathDetail() {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<AiPathGenerateResponse | null>(null);
  const [expandedSubNodes, setExpandedSubNodes] = useState<Record<string, boolean>>({});
  const [subNodeDetails, setSubNodeDetails] = useState<Record<string, SubNodeDetailResponse>>({});
  const [loadingSubNodes, setLoadingSubNodes] = useState<Record<string, boolean>>({});
  const [subNodeErrors, setSubNodeErrors] = useState<Record<string, string>>({});
  const [loadingProject, setLoadingProject] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const projectIdRaw = searchParams.get("project_id");
    const projectId = projectIdRaw ? Number(projectIdRaw) : NaN;

    if (projectIdRaw && Number.isFinite(projectId) && projectId > 0) {
      setLoadingProject(true);
      setLoadError("");
      getAiPathProject(projectId)
        .then((response) => {
          setResult(response);
          window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(response));
        })
        .catch((e: unknown) => {
          const err = e as { response?: { data?: { detail?: string } }; message?: string };
          setLoadError(String(err.response?.data?.detail || err.message || "Failed to load AI Path"));
          setResult(readResult());
        })
        .finally(() => setLoadingProject(false));
      return;
    }

    const cached = readResult();
    if (cached) {
      setResult(cached);
      return;
    }

    setLoadingProject(true);
    setLoadError("");
    getLatestAiPathProject()
      .then((response) => {
        setResult(response);
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(response));
      })
      .catch((e: unknown) => {
        const err = e as { response?: { data?: { detail?: string } }; message?: string };
        setLoadError(String(err.response?.data?.detail || err.message || "No saved AI Path found"));
      })
      .finally(() => setLoadingProject(false));
  }, [searchParams]);

  const toggleSubNode = useCallback(async (
    nodeIdx: number,
    subIdx: number,
    subNode: AiPathNode["sub_nodes"] extends (infer T)[] | undefined ? T : never
  ) => {
    const key = `${nodeIdx}-${subIdx}`;

    // If already expanded, just collapse
    if (expandedSubNodes[key]) {
      setExpandedSubNodes(prev => ({ ...prev, [key]: false }));
      return;
    }

    // If already has details, just expand
    if (subNodeDetails[key]) {
      setExpandedSubNodes(prev => ({ ...prev, [key]: true }));
      return;
    }

    const savedDetail =
      subNode.details?.find((item) => item.detail_level === "detailed") ||
      subNode.details?.[0];
    if (savedDetail?.detailed_content) {
      setSubNodeDetails(prev => ({
        ...prev,
        [key]: {
          detail_id: savedDetail.id,
          subnode_id: savedDetail.subnode_id,
          title: subNode.title,
          description: subNode.description || "",
          key_points: subNode.learning_points || [],
          detailed_content: savedDetail.detailed_content,
          code_examples: savedDetail.code_examples || [],
        },
      }));
      setExpandedSubNodes(prev => ({ ...prev, [key]: true }));
      return;
    }

    // Fetch details
    if (!result) return;

    setLoadingSubNodes(prev => ({ ...prev, [key]: true }));
    setSubNodeErrors(prev => ({ ...prev, [key]: "" }));
    try {
      const detail = await getSubNodeDetail({
        subnode_id: subNode.id,
        topic: result.data.title,
        section_title: result.data.nodes[nodeIdx].title,
        subnode_title: subNode.title,
        subnode_description: subNode.description || "",
        subnode_key_points: subNode.learning_points || [],
        level: "intermediate",
        detail_level: "detailed",
      });
      setSubNodeDetails(prev => ({ ...prev, [key]: detail }));
      setExpandedSubNodes(prev => ({ ...prev, [key]: true }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      setSubNodeErrors(prev => ({
        ...prev,
        [key]: String(err.response?.data?.detail || err.message || "Failed to generate detailed content"),
      }));
    } finally {
      setLoadingSubNodes(prev => ({ ...prev, [key]: false }));
    }
  }, [result, expandedSubNodes, subNodeDetails]);

  const articleIntro = result?.data.summary || result?.data.description || "";

  const totalSubNodes =
    result?.data.nodes.reduce(
      (sum, node) => sum + (node.sub_nodes?.length || 0),
      0
    ) || 0;
  const totalResources =
    result?.data.nodes.reduce(
      (sum, node) =>
        sum +
        collectNodeResources(node).length +
        (node.sub_nodes || []).reduce(
          (subSum, subNode) => subSum + (subNode.resources?.length || 0),
          0
        ),
      0
    ) || 0;

  const handleCopySummary = useCallback(() => {
    copySummary(result, articleIntro);
  }, [result, articleIntro]);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="w-full px-4 py-8 md:px-8 md:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-px w-8 bg-sky-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Learning Guide
                </span>
              </div>
              <h1 className="text-3xl font-black leading-[0.92] tracking-tight text-stone-900 md:text-5xl">
                {result?.data.title || "AI Path Detail"}
              </h1>
              {loadingProject && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在从数据库加载学习路径...
                </div>
              )}
              {loadError && (
                <div className="mt-5 rounded-md border border-red-100 bg-red-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">加载失败</p>
                      <p className="mt-1 text-xs leading-6 text-red-700">{loadError}</p>
                    </div>
                  </div>
                </div>
              )}
              {articleIntro && (
                <p className="mt-5 text-sm leading-7 text-stone-600 md:text-base md:leading-8">
                  {articleIntro}
                </p>
              )}
              {result && (
                <div className="mt-6 flex flex-wrap gap-3 text-xs text-stone-500">
                  <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5">
                    {result.data.nodes.length} stages
                  </span>
                  <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5">
                    {totalSubNodes} sub topics
                  </span>
                  <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5">
                    {totalResources} resources
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/ai-path"
                className="inline-flex h-10 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-900"
              >
                Back to AI Path
              </Link>
              <Button
                type="button"
                onClick={handleCopySummary}
                disabled={!result}
                className="rounded-full bg-sky-500 px-6 text-white hover:bg-sky-600"
              >
                Copy guide intro
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-8 md:px-8 md:py-10">
        {loadingProject && !result ? (
          <div className="rounded-md border border-sky-100 bg-white px-6 py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-500" />
            <h2 className="mt-5 text-2xl font-black tracking-tight text-stone-900">
              正在加载 AI Path
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-500">
              正在从数据库读取章节和知识点。
            </p>
          </div>
        ) : !result ? (
          <div className="rounded-md border border-dashed border-stone-300 bg-white px-6 py-20 text-center">
            <div className="mx-auto max-w-xl">
              <h2 className="text-2xl font-black tracking-tight text-stone-900">
                还没有 AI Path 结果
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-500">
                先去 AI Path 页面输入你的学习目标，生成结果后会自动跳转到这里。
              </p>
              <Link
                to="/ai-path"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-sky-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
              >
                Go generate
              </Link>
            </div>
          </div>
        ) : (
          <>
            {result.warnings?.filter(w => !w.includes('Result saved to')).length ? (
              <section className="mb-8 rounded-lg bg-gradient-to-r from-stone-50 to-stone-100 border border-stone-200 px-6 py-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-sky-500 rounded-full" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-500">
                    Generation Info
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {result.warnings.filter(w => !w.includes('Result saved to')).map((warning, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs text-stone-600 shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      {warning}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-1 lg:items-start">
              <article className="lg:col-span-12 space-y-8">
                <section className="rounded-md border border-stone-200 bg-white px-6 py-6 shadow-sm md:px-8 md:py-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                    How to use this guide
                  </p>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-stone-600">
                    <p>
                      把这份 AI Path
                      当成一篇可执行的学习指南来读：先理解总览，再按阶段推进。每个阶段都提供了目标说明、实践步骤和资源入口，建议你边读边做记录，不要只收藏不练习。
                    </p>
                    <p>
                      如果你时间有限，可以先从目录中挑当前最重要的一章开始；如果你想系统掌握这个主题，建议按顺序阅读并在每个阶段完成一个最小产出。
                    </p>
                  </div>
                </section>

                {result.data.nodes.map((node, idx) => (
                  <section
                    key={`${idx}-${node.title}`}
                    id={stageAnchor(node, idx)}
                    className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm"
                  >
                    <div className="border-b border-stone-100 bg-stone-50 px-6 py-5 md:px-8 md:py-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="w-full">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-sky-100 px-3 text-xs font-black text-sky-700">
                              {idx + 1}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                              Stage {idx + 1}
                            </span>
                          </div>
                          <h2 className="mt-3 text-2xl font-black tracking-tight text-stone-900 md:text-[2rem]">
                            {node.title}
                          </h2>
                          <p className="mt-3 text-sm leading-7 text-stone-600 md:text-base">
                            {node.description || node.explanation}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs text-stone-500 md:min-w-48">
                          <div className="rounded-md border border-stone-200 bg-white px-4 py-3">
                            <div className="font-bold text-stone-900">
                              {node.sub_nodes?.length || 0}
                            </div>
                            <div className="mt-1">sub topics</div>
                          </div>
                          <div className="rounded-md border border-stone-200 bg-white px-4 py-3">
                            <div className="font-bold text-stone-900">
                              {collectAllNodeResources(node).length}
                            </div>
                            <div className="mt-1">resources</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-6 md:px-8 md:py-8">
                      <div className="space-y-8">
                        {node.explanation && (
                          <section className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                              Stage overview
                            </p>
                            <div className="rounded-md bg-stone-50 px-5 py-5 text-sm leading-8 text-stone-700 md:text-[15px]">
                              {node.explanation}
                            </div>
                          </section>
                        )}

                        {node.tutorial?.length ? (
                          <section className="space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                              Suggested learning flow
                            </p>
                            <ol className="space-y-3">
                              {node.tutorial.map((step, stepIdx) => (
                                <li
                                  key={`${node.title}-${stepIdx}`}
                                  className="flex gap-4 rounded-md border border-stone-200 bg-white px-4 py-4"
                                >
                                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[10px] font-black text-white">
                                    {stepIdx + 1}
                                  </span>
                                  <span className="text-sm leading-7 text-stone-700">
                                    {step}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </section>
                        ) : null}

                        {node.sub_nodes?.length ? (
                          <section className="space-y-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                              What you should cover in this stage
                            </p>
                            <div className="space-y-5">
                              {node.sub_nodes.map((subNode, subIdx) => {
                                const key = `${idx}-${subIdx}`;
                                const isExpanded = expandedSubNodes[key];
                                const isLoading = loadingSubNodes[key];
                                const detail = subNodeDetails[key];
                                const subNodeError = subNodeErrors[key];

                                return (
                                  <article
                                    key={key}
                                    className="rounded-md border border-stone-200 bg-stone-50 overflow-hidden"
                                  >
                                    {/* Clickable header */}
                                    <button
                                      type="button"
                                      onClick={() => toggleSubNode(idx, subIdx, subNode)}
                                      className="w-full px-5 py-5 text-left hover:bg-stone-100 transition-colors"
                                    >
                                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                                              {idx + 1}.{subIdx + 1}
                                            </span>
                                            <h3 className="text-lg font-bold text-stone-900">
                                              {subNode.title}
                                            </h3>
                                            <ChevronDown
                                              className={`w-4 h-4 text-stone-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                            />
                                            {isLoading && (
                                              <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
                                            )}
                                          </div>
                                          {subNode.description && (
                                            <p className="mt-3 text-sm leading-7 text-stone-600">
                                              {subNode.description}
                                            </p>
                                          )}

                                          {subNode.learning_points?.length ? (
                                            <ul className="mt-4 space-y-2">
                                              {subNode.learning_points.map(
                                                (
                                                  point: string,
                                                  pointIdx: number
                                                ) => (
                                                  <li
                                                    key={`${subNode.title}-${pointIdx}`}
                                                    className="flex gap-3 text-sm leading-7 text-stone-700"
                                                  >
                                                    <span className="mt-2 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                                                    <span>{point}</span>
                                                  </li>
                                                )
                                              )}
                                            </ul>
                                          ) : null}
                                        </div>

                                        {subNode.resources?.length ? (
                                          <aside className="w-full lg:w-80">
                                            <div className="rounded-md border border-stone-200 bg-white p-4">
                                              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                                                Embedded resources
                                              </p>
                                              <div className="mt-4 space-y-3">
                                                {subNode.resources.map(
                                                  (resource) => (
                                                    <a
                                                      key={`${subNode.title}-${resource.url}`}
                                                      href={resource.url}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className="group flex items-start gap-3 rounded-md border border-stone-100 bg-stone-50 p-3 transition-colors hover:border-stone-200 hover:bg-white"
                                                    >
                                                      <div
                                                        className="h-10 w-10 shrink-0 rounded-none bg-stone-100 bg-cover bg-center"
                                                        style={{
                                                          backgroundImage: `url(${resourceThumbnail(
                                                            resource
                                                          )})`,
                                                        }}
                                                      />
                                                      <div className="min-w-0">
                                                        <div
                                                          className="text-[10px] font-semibold uppercase tracking-wider"
                                                          style={{
                                                            color: getCategoryColor(
                                                              resourceHost(
                                                                resource.url
                                                              )
                                                            ),
                                                          }}
                                                        >
                                                          {resourceTypeLabel(
                                                            resource.url
                                                          )}{" "}
                                                          ·{" "}
                                                          {resourceHost(
                                                            resource.url
                                                          )}
                                                        </div>
                                                        <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-stone-800 group-hover:text-sky-600">
                                                          {resourceDisplayTitle(
                                                            resource
                                                          )}
                                                        </div>
                                                      </div>
                                                    </a>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          </aside>
                                        ) : null}
                                      </div>
                                    </button>

                                    {/* Expanded detail content */}
                                    {isExpanded && detail && (
                                      <div className="border-t border-stone-200 bg-white px-5 py-5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-600 mb-4">
                                          Detailed Content
                                        </p>
                                        <div
                                          className="prose prose-sm prose-stone max-w-none"
                                          dangerouslySetInnerHTML={{
                                            __html: renderMarkdown(detail.detailed_content)
                                          }}
                                        />
                                        {detail.code_examples?.length ? (
                                          <div className="mt-6">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400 mb-3">
                                              Code Examples
                                            </p>
                                            {detail.code_examples.map((example, i) => (
                                              <pre
                                                key={i}
                                                className="bg-stone-50 border border-stone-200 rounded-md p-4 overflow-x-auto text-xs mb-3 font-mono"
                                                dangerouslySetInnerHTML={{
                                                  __html: highlightSyntax(example, 'python')
                                                }}
                                              />
                                            ))}
                                          </div>
                                        ) : null}
                                      </div>
                                    )}

                                    {/* Loading state */}
                                    {isLoading && (
                                      <div className="border-t border-stone-200 bg-white px-5 py-8">
                                        <div className="flex items-center justify-center gap-3">
                                          <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
                                          <span className="text-sm text-stone-600">Generating detailed content for this topic...</span>
                                        </div>
                                        <p className="text-xs text-stone-400 text-center mt-2">
                                          This may take 1-3 minutes. Once generated, it will be cached.
                                        </p>
                                      </div>
                                    )}

                                    {subNodeError && !isLoading && (
                                      <div className="border-t border-red-100 bg-red-50 px-5 py-4">
                                        <div className="flex items-start gap-3">
                                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                                          <div>
                                            <p className="text-sm font-semibold text-red-900">
                                              详情生成失败
                                            </p>
                                            <p className="mt-1 text-xs leading-6 text-red-700">
                                              {subNodeError}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </article>
                                );
                              })}
                            </div>
                          </section>
                        ) : null}

                        {collectNodeResources(node).length ? (
                          <section className="space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                              Recommended resources for this stage
                            </p>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              {collectNodeResources(node).map((resource) => (
                                <a
                                  key={`${node.title}-${resource.url}`}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group block overflow-hidden rounded-md border border-stone-200 bg-white transition-all duration-200 hover:border-stone-300 hover:shadow-md"
                                >
                                  <div
                                    className="relative h-40 bg-stone-100 bg-cover bg-center"
                                    style={{
                                      backgroundImage: `url(${resourceThumbnail(
                                        resource
                                      )})`,
                                    }}
                                  />
                                  <div className="p-4">
                                    <div
                                      className="text-[10px] font-semibold uppercase tracking-wider"
                                      style={{
                                        color: getCategoryColor(
                                          resourceHost(resource.url)
                                        ),
                                      }}
                                    >
                                      {resourceTypeLabel(resource.url)} ·{" "}
                                      {resourceHost(resource.url)}
                                    </div>
                                    <h4 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-stone-800 group-hover:text-sky-600">
                                      {resourceDisplayTitle(resource)}
                                    </h4>
                                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-400">
                                      {resourceDisplaySummary(resource)}
                                    </p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </section>
                        ) : null}
                      </div>
                    </div>
                  </section>
                ))}

	                {result.data.recommendations?.length ? (
	                  <section className="rounded-md border border-stone-200 bg-white px-6 py-6 shadow-sm md:px-8 md:py-8">
	                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
	                      Final recommendations
	                    </p>
	                    <div className="mt-4 space-y-3">
	                      {result.data.recommendations.map(
	                        (item: string, idx: number) => (
	                          <div
	                            key={`${item}-${idx}`}
	                            className="flex gap-3 rounded-md bg-stone-50 px-4 py-4 text-sm leading-7 text-stone-700"
	                          >
	                            <span className="mt-2 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
	                            <span>{item}</span>
	                          </div>
	                        )
	                      )}
	                    </div>
	                  </section>
	                ) : null}
	              </article>
	            </div>
	          </>
	        )}
      </main>
    </div>
  );
}
