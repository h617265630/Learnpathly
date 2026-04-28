import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ResourceCard, type UiResource } from "@/components/ResourceCard";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  Layers,
  Lightbulb,
  Loader2,
  Target,
} from "lucide-react";
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

type AiPathSubNodeItem = NonNullable<AiPathNode["sub_nodes"]>[number];

type CodeExampleBlock = {
  language: string;
  code: string;
};

type LessonItem = {
  key: string;
  nodeIdx: number;
  subIdx: number;
  ordinal: number;
  node: AiPathNode;
  subNode: AiPathSubNodeItem;
};

const CODE_LANGUAGE_MARKERS = new Set([
  "bash",
  "shell",
  "sh",
  "zsh",
  "javascript",
  "js",
  "typescript",
  "ts",
  "tsx",
  "python",
  "py",
  "yaml",
  "yml",
  "json",
  "sql",
  "java",
  "html",
  "css",
]);

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

function collectTopicResources(nodes: AiPathNode[]): AiPathResourceLink[] {
  const seen = new Set<string>();
  const links: AiPathResourceLink[] = [];

  for (const node of nodes) {
    for (const item of collectAllNodeResources(node)) {
      const url = String(item?.url || "").trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      links.push({ ...item, url });
    }
  }

  return links;
}

function subNodeHasDetail(subNode: AiPathSubNodeItem) {
  return Boolean(
    subNode.details?.some((item) => String(item.detailed_content || "").trim())
  );
}

function nodeDetailCount(node: AiPathNode) {
  return (node.sub_nodes || []).filter(subNodeHasDetail).length;
}

function savedDetailToResponse(
  subNode: AiPathSubNodeItem
): SubNodeDetailResponse | null {
  const savedDetail =
    subNode.details?.find((item) => item.detail_level === "detailed") ||
    subNode.details?.[0];
  if (!savedDetail?.detailed_content) return null;
  return {
    detail_id: savedDetail.id,
    subnode_id: savedDetail.subnode_id,
    title: subNode.title,
    description: subNode.description || "",
    key_points: subNode.learning_points || [],
    detailed_content: savedDetail.detailed_content,
    code_examples: savedDetail.code_examples || [],
    structured_content: savedDetail.structured_content || {},
  };
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(content: string): string {
  const codeBlocks: string[] = [];

  // Escape HTML first
  let html = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Temporarily remove fenced code blocks so the markdown passes below do not
  // mutate code contents or generated <pre>/<code> markup.
  html = html.replace(/```([\w-]+)?\n?([\s\S]*?)```/g, (_match, lang, code) => {
    const trimmedCode = code.trim();
    const detectedLang = inferCodeLanguage(trimmedCode);
    const finalLang = detectedLang !== "text" ? detectedLang : lang || "text";
    const highlightedCode = highlightSyntax(trimmedCode, finalLang);
    const label = finalLang.toUpperCase();
    const rawCode = escapeHtmlAttribute(trimmedCode);
    const block = `<div class="my-6 overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm"><div class="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-2"><span class="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700">${label}</span><button type="button" data-ai-code-copy="true" data-code="${rawCode}" class="rounded border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500 transition-colors hover:border-sky-200 hover:text-sky-700">Copy</button></div><pre class="m-0 overflow-x-auto bg-white p-4 text-xs font-mono leading-6 text-stone-800"><code>${highlightedCode}</code></pre></div>`;
    const token = `@@CODE_BLOCK_${codeBlocks.length}@@`;
    codeBlocks.push(block);
    return token;
  });

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-stone-100 px-1.5 py-0.5 rounded text-xs text-stone-800 font-mono">$1</code>');

  // Headers (# ## ### #### ##### ######)
  html = html.replace(/^###### (.+)$/gm, '<h6 class="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5 class="mt-6 mb-2 text-sm font-bold text-stone-700">$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4 class="mt-7 mb-3 text-base font-bold text-stone-800">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="mt-8 mb-3 border-l-4 border-sky-300 pl-3 text-lg font-black text-stone-900">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="mt-10 mb-4 text-2xl font-black tracking-tight text-stone-950">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="mb-5 text-3xl font-black tracking-tight text-stone-950">$1</h1>');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong class="font-semibold">$1</strong>');

  // Italic (*text* or _text_)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Unordered lists (- item or * item)
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 text-[15px] leading-7 text-stone-700">$1</li>');
  html = html.replace(/^\* (.+)$/gm, '<li class="ml-4 text-[15px] leading-7 text-stone-700">$1</li>');

  // Ordered lists (1. item)
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-[15px] leading-7 text-stone-700">$1</li>');

  // Wrap consecutive li elements in ul
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    return `<ul class="list-disc list-inside space-y-1 my-3">${match}</ul>`;
  });

  // Paragraphs (double newline)
  html = html.replace(/\n\n/g, '</p><p class="my-4 text-[15px] leading-8 text-stone-600">');

  // Single newline to br
  html = html.replace(/\n/g, '<br/>');

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = `<p class="my-4 text-[15px] leading-8 text-stone-600">${html}</p>`;
  }

  html = html.replace(/<p class="[^"]*">\s*(@@CODE_BLOCK_\d+@@)\s*<\/p>/g, "$1");
  html = html.replace(/@@CODE_BLOCK_(\d+)@@/g, (_match, index) => {
    return codeBlocks[Number(index)] || "";
  });

  return html;
}

function highlightSyntax(code: string, lang: string): string {
  const escapeHtml = (value: string) =>
    value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const tokenKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const tokens: string[] = [];
  const store = (value: string, className: string) => {
    const idx = tokens.length;
    const token =
      "§CODETOKEN" +
      [...String(idx)]
        .map((char) => tokenKeys[Number(char)])
        .join("") +
      "§";
    tokens.push(`<span class="${className}">${value}</span>`);
    return token;
  };

  const keywords: Record<string, string[]> = {
    python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'with', 'as', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'async', 'await', 'yield', 'lambda', 'pass', 'break', 'continue'],
    javascript: ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof'],
    typescript: ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'interface', 'type', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'enum', 'implements', 'extends', 'private', 'public', 'protected'],
    java: ['public', 'private', 'protected', 'class', 'static', 'void', 'String', 'int', 'boolean', 'return', 'if', 'else', 'for', 'while', 'new', 'extends', 'implements', 'import', 'package', 'try', 'catch', 'true', 'false', 'null'],
    bash: ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'export', 'set', 'echo', 'cd', 'mkdir', 'chmod', 'chown', 'sudo'],
    json: ['true', 'false', 'null'],
    yaml: ['true', 'false', 'null'],
    sql: ['select', 'from', 'where', 'insert', 'into', 'update', 'delete', 'create', 'table', 'join', 'left', 'right', 'inner', 'outer', 'group', 'by', 'order', 'limit', 'as', 'and', 'or', 'not'],
    default: ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'def', 'async', 'await', 'try', 'catch', 'new', 'this', 'true', 'false', 'null', 'None']
  };

  const normalizedLang = normalizeCodeLanguage(lang);
  const langKeywords = keywords[normalizedLang] || keywords.default;

  let highlighted = escapeHtml(code);

  if (normalizedLang === "python" || normalizedLang === "bash" || normalizedLang === "yaml") {
    highlighted = highlighted.replace(/(^|\s)(#.*)$/gm, (_match, prefix, comment) => {
      return `${prefix}${store(comment, "text-stone-500 italic")}`;
    });
  } else {
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, (match) =>
      store(match, "text-stone-500 italic")
    );
    highlighted = highlighted.replace(/(^|\s)(\/\/.*)$/gm, (_match, prefix, comment) => {
      return `${prefix}${store(comment, "text-stone-500 italic")}`;
    });
  }

  highlighted = highlighted.replace(
    /(["'`])(?:\\.|(?!\1)[^\\\r\n])*\1/g,
    (match) => store(match, "text-emerald-700")
  );

  if (normalizedLang === "yaml" || normalizedLang === "json") {
    highlighted = highlighted.replace(
      /^(\s*)([A-Za-z0-9_.-]+)(\s*:)/gm,
      (_match, indent, key, colon) =>
        `${indent}${store(key, "text-sky-700 font-semibold")}${colon}`
    );
  }

  for (const kw of langKeywords) {
    highlighted = highlighted.replace(new RegExp(`\\b(${kw})\\b`, "gi"), (match) =>
      store(match, "text-sky-700 font-semibold")
    );
  }

  highlighted = highlighted.replace(
    /\b(\d+\.?\d*)\b/g,
    (match) => store(match, "text-fuchsia-700")
  );

  highlighted = highlighted.replace(
    /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    (_match, name) => `${store(name, "text-amber-700 font-semibold")}(`
  );

  tokens.forEach((html, idx) => {
    const token =
      "§CODETOKEN" +
      [...String(idx)]
        .map((char) => tokenKeys[Number(char)])
        .join("") +
      "§";
    highlighted = highlighted.replaceAll(token, html);
  });

  return highlighted;
}

function inferCodeLanguage(code: string): string {
  const lowered = code.toLowerCase();
  if (lowered.trimStart().startsWith("yaml\n") || lowered.includes("\nprovider:") || lowered.includes("\nmemory:")) {
    return "yaml";
  }
  if (lowered.trimStart().startsWith("json\n") || lowered.trimStart().startsWith("{")) {
    return "json";
  }
  if (code.includes("public class ") || code.includes("System.out.") || code.includes("import java.")) {
    return "java";
  }
  if (code.includes("interface ") || code.includes(": string") || code.includes(": number") || code.includes("React.")) {
    return "typescript";
  }
  if (code.includes("function ") || code.includes("const ") || code.includes("let ") || code.includes("=>") || code.includes("module.exports")) {
    return "javascript";
  }
  if (code.includes("def ") || code.includes("import pandas") || code.includes("print(") || code.includes("if __name__")) {
    return "python";
  }
  if (lowered.includes("select ") || lowered.includes(" from ") || lowered.includes("create table")) {
    return "sql";
  }
  if (code.includes("#!/bin/bash") || code.includes("npm ") || code.includes("git ") || code.includes("curl ")) {
    return "bash";
  }
  return "text";
}

function normalizeCodeLanguage(language: string) {
  const lower = language.trim().toLowerCase();
  if (lower === "js") return "javascript";
  if (lower === "ts" || lower === "tsx") return "typescript";
  if (lower === "py") return "python";
  if (lower === "yml") return "yaml";
  if (lower === "sh" || lower === "shell" || lower === "zsh") return "bash";
  return lower || "text";
}

function stripGeneratedCodeSection(content: string, hasSeparateExamples: boolean) {
  if (!hasSeparateExamples) return content;
  const marker = content.search(/^##\s+(Runnable\s+)?Code Examples\b/im);
  if (marker < 0) return content;

  const before = content.slice(0, marker).trimEnd();
  const after = content.slice(marker);
  const nextSection = after.search(/^##\s+(Common Mistakes|Best Practices|Practice|Summary|Resources)\b/im);
  if (nextSection < 0) return before;
  return `${before}\n\n${after.slice(nextSection).trimStart()}`.trim();
}

function extractCodeExampleBlocks(example: string): CodeExampleBlock[] {
  const source = String(example || "").trim();
  if (!source) return [];

  const fencedBlocks = [...source.matchAll(/```([\w-]+)?\n?([\s\S]*?)```/g)];
  if (fencedBlocks.length) {
    return fencedBlocks
      .map((match) => {
        const code = String(match[2] || "").trim();
        const language = normalizeCodeLanguage(String(match[1] || "")) || inferCodeLanguage(code);
        return { language: language === "text" ? inferCodeLanguage(code) : language, code };
      })
      .filter((block) => block.code);
  }

  const lines = source.split(/\r?\n/);
  const blocks: CodeExampleBlock[] = [];
  let currentLanguage = "";
  let currentLines: string[] = [];

  const flush = () => {
    const code = currentLines.join("\n").trim();
    if (!code) return;
    const inferred = inferCodeLanguage(code);
    blocks.push({
      language: currentLanguage ? normalizeCodeLanguage(currentLanguage) : inferred,
      code,
    });
    currentLines = [];
  };

  for (const line of lines) {
    const marker = line.trim().toLowerCase();
    if (CODE_LANGUAGE_MARKERS.has(marker)) {
      flush();
      currentLanguage = marker;
      continue;
    }
    currentLines.push(line);
  }
  flush();

  if (blocks.length) return blocks;
  return [{ language: inferCodeLanguage(source), code: source }];
}

function collectCodeExampleBlocks(detail: SubNodeDetailResponse): CodeExampleBlock[] {
  return (detail.code_examples || []).flatMap(extractCodeExampleBlocks);
}

function getStructuredObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function getStructuredPractice(value: unknown) {
  const obj = getStructuredObject(value);
  return {
    title: String(obj.title || "Practice task"),
    description: String(obj.description || ""),
    expected_output: String(obj.expected_output || ""),
  };
}

function completionStorageKey(result: AiPathGenerateResponse | null) {
  if (!result) return "";
  return `learnsmart_ai_path_completion_${
    result.project_id || result.data.title || "current"
  }`;
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

function aiPathResourceToUiResource(
  resource: AiPathResourceLink,
  index: number
): UiResource {
  const host = resourceHost(resource.url);
  const type = resource.resource_type || resourceTypeLabel(resource.url);
  return {
    id: index + 1,
    title: resourceDisplayTitle(resource),
    summary: resourceDisplaySummary(resource),
    categoryLabel: type,
    categoryColor: getCategoryColor(type || host),
    platform: host.includes("github.com") ? "github" : host,
    platformLabel: host,
    typeLabel: type,
    thumbnail: resourceThumbnail(resource),
    resource_type: type,
    url: resource.url,
  };
}

function openAiPathResource(resource: UiResource) {
  if (!resource.url) return;
  window.open(resource.url, "_blank", "noopener,noreferrer");
}

function detailContainsCodeSection(detail?: SubNodeDetailResponse) {
  return Boolean(detail?.detailed_content?.includes("## Code Examples"));
}

function firstMeaningfulSentence(...values: Array<string | undefined>) {
  const text = values
    .map((value) => String(value || "").trim())
    .find(Boolean);
  if (!text) return "";
  const sentence = text.match(/^(.+?[.!?])(\s|$)/);
  return sentence?.[1] || text;
}

function collectSubNodeResources(
  node: AiPathNode,
  subNode: AiPathSubNodeItem
): AiPathResourceLink[] {
  const seen = new Set<string>();
  const links: AiPathResourceLink[] = [];
  for (const item of [...(subNode.resources || []), ...(node.resources || [])]) {
    const url = String(item?.url || "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    links.push({ ...item, url });
  }
  return links;
}

function buildSuggestedResourceLinks(
  topic: string,
  node: AiPathNode,
  subNode: AiPathSubNodeItem
): AiPathResourceLink[] {
  const query = [topic, subNode.title].filter(Boolean).join(" ");
  const encoded = encodeURIComponent(query);
  const githubQuery = encodeURIComponent(`${query} example project`);
  return [
    {
      url: `https://www.google.com/search?q=${encoded}+official+docs`,
      title: "Official docs search",
      description: "Use this when you need the source documentation behind the concept.",
      resource_type: "document",
      learning_stage: node.title,
    },
    {
      url: `https://github.com/search?q=${githubQuery}&type=repositories`,
      title: "Example projects on GitHub",
      description: "Find real repositories that show how this idea is used in practice.",
      resource_type: "repo",
      learning_stage: node.title,
    },
    {
      url: `https://www.youtube.com/results?search_query=${encoded}+tutorial`,
      title: "Walkthrough videos",
      description: "Good for seeing the workflow performed end to end.",
      resource_type: "video",
      learning_stage: node.title,
    },
  ];
}

function buildTopicSuggestedResourceLinks(topic: string): AiPathResourceLink[] {
  const encoded = encodeURIComponent(topic);
  const githubQuery = encodeURIComponent(`${topic} learning path examples`);
  return [
    {
      url: `https://www.google.com/search?q=${encoded}+official+docs+guide`,
      title: "Official docs and guides",
      description: "Start from official documentation and canonical guides for this topic.",
      resource_type: "document",
      learning_stage: "Overview",
    },
    {
      url: `https://github.com/search?q=${githubQuery}&type=repositories`,
      title: "Example projects on GitHub",
      description: "Browse real projects and templates that show the topic in practice.",
      resource_type: "repo",
      learning_stage: "Practice",
    },
    {
      url: `https://www.youtube.com/results?search_query=${encoded}+tutorial+project`,
      title: "Project walkthrough videos",
      description: "Use video walkthroughs when you want to see the complete workflow.",
      resource_type: "video",
      learning_stage: "Practice",
    },
  ];
}

function TutorialCallout({
  title,
  children,
  tone = "sky",
  icon,
}: {
  title: string;
  children: ReactNode;
  tone?: "sky" | "emerald" | "amber" | "stone";
  icon: ReactNode;
}) {
  const toneClass = {
    sky: "border-sky-200 bg-sky-50 text-sky-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    stone: "border-stone-200 bg-stone-50 text-stone-800",
  }[tone];

  return (
    <section className={`border-l-4 px-4 py-4 ${toneClass}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">
            {title}
          </p>
          <div className="mt-2 text-sm leading-7">{children}</div>
        </div>
      </div>
    </section>
  );
}

function LearningFlowDiagram({ points }: { points: string[] }) {
  if (!points.length) return null;
  return (
    <section className="border-y border-stone-200 bg-stone-50 px-4 py-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">
        <Layers className="h-3.5 w-3.5 text-sky-600" />
        Concept flow
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {points.slice(0, 3).map((point, idx) => (
          <div key={`${point}-${idx}`} className="relative rounded-md bg-white px-4 py-4 shadow-sm ring-1 ring-stone-200">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-black text-sky-700">
              {idx + 1}
            </span>
            <p className="mt-3 text-sm font-semibold leading-6 text-stone-800">
              {point}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PracticeBlock({
  subNode,
  node,
}: {
  subNode: AiPathSubNodeItem;
  node: AiPathNode;
}) {
  const task =
    subNode.practical_exercise ||
    `Create a small working note or demo that proves you can apply "${subNode.title}" inside the "${node.title.replace(/^Chapter\s+\d+:\s*/i, "")}" stage.`;

  return (
    <TutorialCallout
      title="Practice task"
      tone="emerald"
      icon={<Target className="h-4 w-4" />}
    >
      <p>{task}</p>
      <p className="mt-2 text-xs leading-6 opacity-80">
        Expected output: a short README, command log, screenshot, or repo commit that captures what you tried and what changed.
      </p>
    </TutorialCallout>
  );
}

function ResourceLinkList({
  resources,
  title = "Linked resources",
  compact = false,
}: {
  resources: AiPathResourceLink[];
  suggestedResources: AiPathResourceLink[];
  title?: string;
  compact?: boolean;
}) {
  const visible = resources;
  if (!visible.length) return null;

  return (
    <section className="rounded-md border border-stone-200 bg-white px-5 py-5 md:px-6 md:py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">
          <BookOpen className="h-3.5 w-3.5 text-sky-600" />
          {title}
        </div>
      </div>
      <div
        className={`mt-4 grid gap-4 ${
          compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {visible.slice(0, compact ? 4 : 6).map((resource, idx) => {
          const ui = aiPathResourceToUiResource(resource, idx);
          return (
            <ResourceCard
              key={`${resource.url}-${idx}`}
              resource={ui}
              onOpen={() => openAiPathResource(ui)}
              onAdd={() => {}}
              saving={false}
              saved={false}
              size={compact ? "sm" : "md"}
            />
          );
        })}
      </div>
    </section>
  );
}

function SidebarResourceList({
  resources,
}: {
  resources: AiPathResourceLink[];
  suggestedResources: AiPathResourceLink[];
}) {
  const visible = resources;
  if (!visible.length) return null;

  return (
    <section className="rounded-md border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">
          Lesson resources
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {visible.slice(0, 4).map((resource, idx) => {
          const ui = aiPathResourceToUiResource(resource, idx);
          return (
            <ResourceCard
              key={`${resource.url}-${idx}`}
              resource={ui}
              onOpen={() => openAiPathResource(ui)}
              onAdd={() => {}}
              saving={false}
              saved={false}
              size="sm"
            />
          );
        })}
      </div>
    </section>
  );
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
  const [activeLessonKey, setActiveLessonKey] = useState("");
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleCodeCopy = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>("[data-ai-code-copy]");
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      const code = button.getAttribute("data-code") || "";
      if (!code) return;

      try {
        await navigator.clipboard.writeText(code);
        const previous = button.innerHTML;
        button.innerHTML = "Copied";
        button.setAttribute("data-copied", "true");
        window.setTimeout(() => {
          button.innerHTML = previous;
          button.removeAttribute("data-copied");
        }, 1400);
      } catch {
        window.prompt("Copy code", code);
      }
    };

    document.addEventListener("click", handleCodeCopy);
    return () => document.removeEventListener("click", handleCodeCopy);
  }, []);

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

  const lessonItems = useMemo<LessonItem[]>(() => {
    if (!result) return [];
    const items: LessonItem[] = [];
    result.data.nodes.forEach((node, nodeIdx) => {
      (node.sub_nodes || []).forEach((subNode, subIdx) => {
        items.push({
          key: `${nodeIdx}-${subIdx}`,
          nodeIdx,
          subIdx,
          ordinal: items.length + 1,
          node,
          subNode,
        });
      });
    });
    return items;
  }, [result]);

  useEffect(() => {
    if (!lessonItems.length) {
      setActiveLessonKey("");
      return;
    }
    if (!activeLessonKey || !lessonItems.some((item) => item.key === activeLessonKey)) {
      setActiveLessonKey(lessonItems[0].key);
    }
  }, [activeLessonKey, lessonItems]);

  const activeLesson =
    lessonItems.find((item) => item.key === activeLessonKey) || lessonItems[0];

  const activeLessonIndex = activeLesson
    ? lessonItems.findIndex((item) => item.key === activeLesson.key)
    : -1;
  const previousLesson =
    activeLessonIndex > 0 ? lessonItems[activeLessonIndex - 1] : null;
  const nextLesson =
    activeLessonIndex >= 0 && activeLessonIndex < lessonItems.length - 1
      ? lessonItems[activeLessonIndex + 1]
      : null;

  const loadLessonDetail = useCallback(
    async (lesson: LessonItem | null | undefined) => {
      if (!lesson || !result) return;
      const { key, nodeIdx, subIdx, subNode } = lesson;
      if (subNodeDetails[key]) return;

      const savedDetail = savedDetailToResponse(subNode);
      if (savedDetail) {
        setSubNodeDetails((prev) => ({ ...prev, [key]: savedDetail }));
        return;
      }

      setLoadingSubNodes((prev) => ({ ...prev, [key]: true }));
      setSubNodeErrors((prev) => ({ ...prev, [key]: "" }));
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
        setSubNodeDetails((prev) => ({ ...prev, [key]: detail }));
      } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string } }; message?: string };
        setSubNodeErrors((prev) => ({
          ...prev,
          [key]: String(err.response?.data?.detail || err.message || "Failed to generate detailed content"),
        }));
      } finally {
        setLoadingSubNodes((prev) => ({ ...prev, [key]: false }));
      }
    },
    [result, subNodeDetails]
  );

  useEffect(() => {
    if (activeLesson) void loadLessonDetail(activeLesson);
  }, [activeLesson, loadLessonDetail]);

  useEffect(() => {
    const key = completionStorageKey(result);
    if (!key) {
      setCompletedLessons({});
      return;
    }

    try {
      const raw = window.localStorage.getItem(key);
      setCompletedLessons(raw ? JSON.parse(raw) : {});
    } catch {
      setCompletedLessons({});
    }
  }, [result]);

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
          structured_content: savedDetail.structured_content || {},
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
  const topicResources = result ? collectTopicResources(result.data.nodes) : [];
  const topicSuggestedResources = result
    ? buildTopicSuggestedResourceLinks(result.data.title)
    : [];
  const completedSubNodeDetails =
    result?.data.nodes.reduce((sum, node) => sum + nodeDetailCount(node), 0) ||
    0;

  const handleCopySummary = useCallback(() => {
    copySummary(result, articleIntro);
  }, [result, articleIntro]);

  const handleToggleLessonComplete = useCallback(() => {
    if (!activeLesson) return;
    setCompletedLessons((prev) => {
      const next = { ...prev, [activeLesson.key]: !prev[activeLesson.key] };
      const key = completionStorageKey(result);
      if (key) window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [activeLesson, result]);

  const activeDetail = activeLesson ? subNodeDetails[activeLesson.key] : undefined;
  const activeIsLoading = activeLesson ? loadingSubNodes[activeLesson.key] : false;
  const activeError = activeLesson ? subNodeErrors[activeLesson.key] : "";
  const activeCodeBlocks = activeDetail ? collectCodeExampleBlocks(activeDetail) : [];
  const activeStructured = getStructuredObject(activeDetail?.structured_content);
  const activeStructuredSteps = getStringList(activeStructured.steps);
  const activeStructuredSummary = String(activeStructured.summary || "");
  const activeStructuredConcept = String(activeStructured.concept || "");
  const activeStructuredPractice = getStructuredPractice(activeStructured.practice);
  const activeExplanation = activeDetail
    ? activeStructuredConcept ||
      stripGeneratedCodeSection(activeDetail.detailed_content, activeCodeBlocks.length > 0)
    : "";
  const activeLinkedResources = activeLesson
    ? collectSubNodeResources(activeLesson.node, activeLesson.subNode)
    : [];
  const activeSuggestedResources =
    result && activeLesson
      ? buildSuggestedResourceLinks(result.data.title, activeLesson.node, activeLesson.subNode)
      : [];
  const progressPercent =
    lessonItems.length && activeLessonIndex >= 0
      ? Math.round(((activeLessonIndex + 1) / lessonItems.length) * 100)
      : 0;
  const completedLessonCount = lessonItems.filter(
    (item) => completedLessons[item.key]
  ).length;
  const completedPercent = lessonItems.length
    ? Math.round((completedLessonCount / lessonItems.length) * 100)
    : 0;
  const activeLessonCompleted = activeLesson
    ? Boolean(completedLessons[activeLesson.key])
    : false;

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
                  <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-sky-700">
                    {completedSubNodeDetails}/{totalSubNodes} details ready
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
            {topicResources.length ? (
              <section className="mb-8">
                <ResourceLinkList
                  resources={topicResources}
                  suggestedResources={topicSuggestedResources}
                  title="Recommended resources for this path"
                />
              </section>
            ) : null}

            {activeLesson ? (
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)_320px] xl:items-start">
                <aside className="rounded-md border border-stone-200 bg-white shadow-sm xl:sticky xl:top-20 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
                  <div className="border-b border-stone-200 px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400">
                      Course Outline
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-stone-500">
                      Lesson {activeLessonIndex + 1} of {lessonItems.length}
                    </p>
                  </div>

                  <div className="space-y-5 px-3 py-4">
                    {result.data.nodes.map((node, nodeIdx) => (
                      <div key={`reader-node-${node.title}`}>
                        <p className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                          {node.title.replace(/^Chapter\s+\d+:\s*/i, "")}
                        </p>
                        <div className="mt-2 space-y-1">
                          {(node.sub_nodes || []).map((subNode, subIdx) => {
                            const key = `${nodeIdx}-${subIdx}`;
                            const isActive = key === activeLesson.key;
                            const ready = subNodeHasDetail(subNode) || Boolean(subNodeDetails[key]);
                            return (
                              <button
                                key={`reader-lesson-${key}`}
                                type="button"
                                onClick={() => setActiveLessonKey(key)}
                                className={`w-full rounded-md px-3 py-3 text-left transition-colors ${
                                  isActive
                                    ? "bg-sky-50 text-sky-800 ring-1 ring-sky-100"
                                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span
                                    className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                                      isActive
                                        ? "bg-sky-500 text-white"
                                        : "bg-stone-100 text-stone-500"
                                    }`}
                                  >
                                    {nodeIdx + 1}.{subIdx + 1}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-sm font-bold leading-5">
                                      {subNode.title.replace(/^\d+\.\d+\s*/, "")}
                                    </span>
                                    <span className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                      {ready ? (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                          Ready
                                        </>
                                      ) : (
                                        "Generate"
                                      )}
                                    </span>
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </aside>

                <article className="min-w-0 overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm">
                  <div className="border-b border-stone-200 bg-white px-5 py-5 md:px-8 md:py-7">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-stone-500">
                      <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sky-700">
                        Lesson {activeLesson.ordinal}
                      </span>
                      <span>
                        {activeLesson.node.title.replace(/^Chapter\s+\d+:\s*/i, "")}
                      </span>
                    </div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-stone-950 md:text-4xl">
                      {activeLesson.subNode.title}
                    </h2>
                    {activeLesson.subNode.description ? (
                      <p className="mt-4 max-w-3xl text-base leading-8 text-stone-600">
                        {activeLesson.subNode.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="px-5 py-6 md:px-8 md:py-8">
                    <div className="max-w-4xl space-y-8">
                      <TutorialCallout
                        title="Lesson goal"
                        tone="sky"
                        icon={<Lightbulb className="h-4 w-4" />}
                      >
                        {firstMeaningfulSentence(
                          activeLesson.subNode.description,
                          activeStructuredSummary,
                          activeDetail?.description,
                          activeDetail?.detailed_content
                        ) || "Understand the core idea, connect it to a real workflow, then produce a small working artifact."}
                      </TutorialCallout>

                      <LearningFlowDiagram
                        points={
                          activeStructuredSteps.length
                            ? activeStructuredSteps
                            : activeLesson.subNode.learning_points || []
                        }
                      />

                      {activeIsLoading ? (
                        <section className="rounded-md border border-sky-100 bg-sky-50 px-5 py-12 text-center">
                          <Loader2 className="mx-auto h-7 w-7 animate-spin text-sky-500" />
                          <p className="mt-4 text-sm font-semibold text-sky-900">
                            Generating this lesson...
                          </p>
                          <p className="mt-2 text-xs text-sky-700">
                            This can take 1-3 minutes, then it will be saved.
                          </p>
                        </section>
                      ) : activeError ? (
                        <section className="rounded-md border border-red-100 bg-red-50 px-5 py-5">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                            <div>
                              <p className="text-sm font-bold text-red-900">
                                Lesson detail failed
                              </p>
                              <p className="mt-1 text-xs leading-6 text-red-700">
                                {activeError}
                              </p>
                            </div>
                          </div>
                        </section>
                      ) : activeDetail ? (
                        <>
                          <section className="rounded-md border border-stone-200 bg-white px-5 py-5 md:px-6 md:py-6">
                            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">
                              <BookOpen className="h-3.5 w-3.5 text-sky-600" />
                              Explanation
                            </div>
                            <div
                              className="max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: renderMarkdown(activeExplanation),
                              }}
                            />
                          </section>

                          <ResourceLinkList
                            resources={activeLinkedResources}
                            suggestedResources={activeSuggestedResources}
                            title="Resources for this lesson"
                          />

                          {activeCodeBlocks.length ? (
                            <section className="space-y-3">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">
                                <Code2 className="h-3.5 w-3.5 text-sky-600" />
                                Runnable examples
                              </div>
                              {activeCodeBlocks.map((example, i) => {
                                const language =
                                  normalizeCodeLanguage(example.language) ||
                                  inferCodeLanguage(example.code);
                                return (
                                  <div
                                    key={`reader-code-${i}`}
                                    className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm"
                                  >
                                    <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-2">
                                      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700">
                                        {language.toUpperCase()}
                                      </span>
                                      <button
                                        type="button"
                                        data-ai-code-copy="true"
                                        data-code={example.code}
                                        className="inline-flex items-center gap-1.5 rounded border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500 transition-colors hover:border-sky-200 hover:text-sky-700"
                                      >
                                        <Copy className="h-3 w-3" />
                                        Copy
                                      </button>
                                    </div>
                                    <pre
                                      className="m-0 overflow-x-auto bg-white p-4 text-xs font-mono leading-6 text-stone-800"
                                      dangerouslySetInnerHTML={{
                                        __html: highlightSyntax(example.code, language),
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </section>
                          ) : null}

                        </>
                      ) : (
                        <section className="rounded-md border border-stone-200 bg-stone-50 px-5 py-10 text-center">
                          <p className="text-sm font-semibold text-stone-700">
                            Select a lesson to load its tutorial.
                          </p>
                        </section>
                      )}

                      <div className="flex flex-col gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          disabled={!previousLesson}
                          onClick={() => previousLesson && setActiveLessonKey(previousLesson.key)}
                          className="inline-flex h-11 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-bold text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Previous lesson
                        </button>
                        <button
                          type="button"
                          disabled={!nextLesson}
                          onClick={() => nextLesson && setActiveLessonKey(nextLesson.key)}
                          className="inline-flex h-11 items-center justify-center rounded-full bg-sky-500 px-5 text-sm font-bold text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next lesson
                        </button>
                      </div>
                    </div>
                  </div>
                </article>

                <aside className="space-y-4 xl:sticky xl:top-20">
                  <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">
                      Learning status
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-stone-50 px-3 py-3">
                        <p className="text-2xl font-black text-stone-950">
                          {completedPercent}%
                        </p>
                        <p className="mt-1 text-xs font-semibold text-stone-500">
                          completed
                        </p>
                      </div>
                      <div className="rounded-md bg-sky-50 px-3 py-3">
                        <p className="text-2xl font-black text-sky-700">
                          {activeLessonIndex + 1}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-sky-700">
                          current lesson
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${completedPercent}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleLessonComplete}
                      className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
                        activeLessonCompleted
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100"
                          : "bg-stone-900 text-white hover:bg-stone-800"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {activeLessonCompleted ? "Marked complete" : "Mark lesson complete"}
                    </button>
                  </section>

                  <section className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-800">
                      <Target className="h-3.5 w-3.5" />
                      Practice task
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-emerald-950">
                      {activeStructuredPractice.description ||
                        activeLesson.subNode.practical_exercise ||
                        `Create a small working note or demo that proves you can apply "${activeLesson.subNode.title}".`}
                    </p>
                    <p className="mt-3 text-xs leading-6 text-emerald-800">
                      Expected output:{" "}
                      {activeStructuredPractice.expected_output ||
                        "a short README, command log, screenshot, or repo commit."}
                    </p>
                  </section>

                  <section className="rounded-md border border-stone-200 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">
                      Reading checklist
                    </p>
                    <ol className="mt-4 space-y-3">
                      {[
                        "Read the lesson goal",
                        "Scan the concept flow",
                        "Copy or run one example",
                        "Create the practice output",
                      ].map((item, idx) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-sm leading-6 text-stone-700"
                        >
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-black text-stone-500">
                            {idx + 1}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ol>
                  </section>

                  <SidebarResourceList
                    resources={activeLinkedResources}
                    suggestedResources={activeSuggestedResources}
                  />
                </aside>

              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
