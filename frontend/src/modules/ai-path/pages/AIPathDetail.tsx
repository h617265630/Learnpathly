import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import type {
  AiPathGenerateResponse,
  AiPathNode,
  AiPathResourceLink,
} from "@/services/aiPath";

const STORAGE_KEY = "learnsmart_ai_path_result_v1";
const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop";

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
    links.push({ url });
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
    links.push({ url });
  }

  for (const subNode of node.sub_nodes || []) {
    for (const item of subNode.resources || []) {
      const url = String(item?.url || "").trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      links.push({ url });
    }
  }

  return links;
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

function resourceThumbnail(url: string) {
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
  const [result, setResult] = useState<AiPathGenerateResponse | null>(null);

  useEffect(() => {
    setResult(readResult());
  }, []);

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
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-px w-8 bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Learning Guide
                </span>
              </div>
              <h1 className="text-3xl font-black leading-[0.92] tracking-tight text-stone-900 md:text-5xl">
                {result?.data.title || "AI Path Detail"}
              </h1>
              {articleIntro && (
                <p className="mt-5 max-w-3xl text-sm leading-7 text-stone-600 md:text-base md:leading-8">
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
                className="rounded-full bg-amber-500 px-6 text-white hover:bg-amber-600"
              >
                Copy guide intro
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        {!result ? (
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
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-amber-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
              >
                Go generate
              </Link>
            </div>
          </div>
        ) : (
          <>
            {result.warnings?.length ? (
              <section className="mb-8 rounded-md border border-amber-200 bg-amber-50 px-5 py-5 md:px-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
                  Reading Notes
                </p>
                <ul className="mt-3 space-y-2">
                  {result.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm leading-6 text-amber-800">
                      {warning}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
              <article className="lg:col-span-8 space-y-8">
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
                        <div className="max-w-3xl">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-amber-100 px-3 text-xs font-black text-amber-700">
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
                              {node.sub_nodes.map((subNode, subIdx) => (
                                <article
                                  key={`${node.title}-${subIdx}-${subNode.title}`}
                                  className="rounded-md border border-stone-200 bg-stone-50 px-5 py-5"
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
                                                <span className="mt-2 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
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
                                                        resource.url
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
                                                    <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-stone-800 group-hover:text-amber-600">
                                                      {resourceTitle(
                                                        resource.url
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
                                </article>
                              ))}
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
                                        resource.url
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
                                    <h4 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-stone-800 group-hover:text-amber-600">
                                      {resourceTitle(resource.url)}
                                    </h4>
                                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-400">
                                      {resource.url}
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
                            <span className="mt-2 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                            <span>{item}</span>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                ) : null}
              </article>

              <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
                <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                    At a glance
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-md bg-stone-50 px-4 py-4">
                      <div className="text-2xl font-black tracking-tight text-stone-900">
                        {result.data.nodes.length}
                      </div>
                      <div className="mt-1 text-xs text-stone-500">stages</div>
                    </div>
                    <div className="rounded-md bg-stone-50 px-4 py-4">
                      <div className="text-2xl font-black tracking-tight text-stone-900">
                        {totalSubNodes}
                      </div>
                      <div className="mt-1 text-xs text-stone-500">
                        sub topics
                      </div>
                    </div>
                    <div className="rounded-md bg-stone-50 px-4 py-4">
                      <div className="text-2xl font-black tracking-tight text-stone-900">
                        {totalResources}
                      </div>
                      <div className="mt-1 text-xs text-stone-500">
                        resources
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                    Outline
                  </p>
                  <nav className="mt-4 space-y-2">
                    {result.data.nodes.map((node, idx) => (
                      <a
                        key={`${idx}-${node.title}-outline`}
                        href={`#${stageAnchor(node, idx)}`}
                        className="block rounded-md border border-stone-100 bg-stone-50 px-4 py-3 transition-colors hover:border-stone-200 hover:bg-white"
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Stage {idx + 1}
                        </div>
                        <div className="mt-1 text-sm font-semibold leading-6 text-stone-800">
                          {node.title}
                        </div>
                      </a>
                    ))}
                  </nav>
                </section>

                <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                    Reading strategy
                  </p>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
                    <p>
                      先通读每个阶段的 overview，再决定你要不要深入到 sub
                      topics。
                    </p>
                    <p>如果时间有限，优先完成每个阶段 tutorial 中的前 3 步。</p>
                    <p>
                      资源是嵌入式补充，不需要一次全部看完，建议按阶段穿插阅读。
                    </p>
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
