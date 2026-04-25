export function formatPlatform(input?: string | null): string {
  const raw = String(input || "").trim();
  if (!raw || raw === "—") return "—";

  const normalized = raw.toLowerCase().replace(/^www\./, "");

  const map: Record<string, string> = {
    youtube: "YouTube",
    bilibili: "Bilibili",
    github: "GitHub",
    medium: "Medium",
    substack: "Substack",
    devto: "Dev.to",
    reddit: "Reddit",
    xiaohongshu: "Xiaohongshu",
    xhs: "Xiaohongshu",
  };

  if (map[normalized]) return map[normalized];

  // Best-effort title case for unknown platforms.
  return raw
    .split(/\s+/)
    .map((word) => {
      const w = word.trim();
      if (!w) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}
