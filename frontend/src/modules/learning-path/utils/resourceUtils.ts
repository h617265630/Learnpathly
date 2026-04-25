export type ModuleType =
  | "video"
  | "document"
  | "article"
  | "clip"
  | "link"
  | "unknown";

export const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&h=506&fit=crop";

export function inferModuleType(item: unknown, r: unknown): ModuleType {
  const presented = String((r as any)?.resource_type || "")
    .trim()
    .toLowerCase();
  const raw = String((item as any)?.resource_type || "")
    .trim()
    .toLowerCase();
  const candidate = presented || raw;

  if (candidate === "video") return "video";
  if (candidate === "document") return "document";
  if (candidate === "article") return "article";
  if (candidate === "clip") return "clip";

  if (candidate === "link") {
    const url = String((r as any)?.source_url || "")
      .trim()
      .toLowerCase();
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "video";
    const base = url.split("?", 1)[0];
    if (base.endsWith(".pdf")) return "document";
    return "article";
  }

  return "unknown";
}
