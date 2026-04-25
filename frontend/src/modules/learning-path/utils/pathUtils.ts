import { type UiResource as CardResource } from "@/components/ResourceCard";
import {
  User,
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Settings,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ResourceType = "video" | "document" | "article" | "clip" | "link";

export type UiResource = {
  id: number;
  title: string;
  summary: string;
  source_url: string | null;
  type: ResourceType;
  platform: string;
  thumbnail: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function normalizePresentedType(raw: unknown): ResourceType {
  const t = String(raw || "")
    .trim()
    .toLowerCase();
  if (["video", "document", "article", "clip", "link"].includes(t))
    return t as ResourceType;
  return "article";
}

export function toUiResource(r: { id: number; title?: string | null; summary?: string | null; source_url?: unknown; resource_type?: unknown; platform?: string | null; thumbnail?: string | null }): UiResource {
  return {
    id: Number(r.id),
    title: String(r.title || "").trim() || `Resource ${r.id}`,
    summary: String(r.summary || "").trim(),
    source_url: (r as any).source_url ?? null,
    type: normalizePresentedType((r as any).resource_type),
    platform: String((r as any).platform || "").trim(),
    thumbnail: String((r as any).thumbnail || "").trim(),
  };
}

export function toCardResource(r: UiResource): CardResource {
  return {
    id: r.id,
    title: r.title,
    summary: r.summary,
    categoryLabel: "Resource",
    categoryColor: "#6b7280",
    platform: r.platform,
    platformLabel: r.platform || "Web",
    typeLabel:
      r.type === "video"
        ? "Video"
        : r.type === "document"
        ? "Doc"
        : r.type === "article"
        ? "Article"
        : r.type === "clip"
        ? "Clip"
        : "Link",
    thumbnail: r.thumbnail,
    resource_type: r.type,
  };
}

export function toAbsoluteImageUrl(raw: unknown): string {
  const url = String(raw || "").trim();
  if (!url) return "";
  if (
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  )
    return url;
  return url;
}

export const USER_MENU_ITEMS = [
  { to: "/account/user-info", label: "Account", icon: User },
  { to: "/my-paths", label: "My Paths", icon: LayoutDashboard },
  { to: "/my-resources", label: "My Resources", icon: BookOpen },
  { to: "/account/plan", label: "Plan & Billing", icon: CreditCard },
  { to: "/account", label: "Settings", icon: Settings },
];

export const WEIGHT_OPTIONS = [
  // Tier
  { value: "tier-gold", label: "Tier Gold" },
  { value: "tier-diamond", label: "Tier Diamond" },
  { value: "tier-prismatic", label: "Tier Prismatic" },
  { value: "tier-obsidian", label: "Tier Obsidian" },
  // Gradient
  { value: "gradient-emerald", label: "Gradient Emerald" },
  { value: "gradient-sapphire", label: "Gradient Sapphire" },
  { value: "gradient-ruby", label: "Gradient Ruby" },
  { value: "gradient-amethyst", label: "Gradient Amethyst" },
  { value: "gradient-gold", label: "Gradient Gold" },
  // Special
  { value: "neu", label: "Neumorphism" },
  { value: "holo", label: "Holographic" },
  { value: "sketch", label: "Sketch" },
  { value: "newspaper", label: "Newspaper" },
  // Neon
  { value: "neon-cyan", label: "Neon Cyan" },
  { value: "neon-pink", label: "Neon Pink" },
  { value: "neon-green", label: "Neon Green" },
  { value: "neon-purple", label: "Neon Purple" },
  { value: "neon-gold", label: "Neon Gold" },
  // Metallic
  { value: "metallic-steel", label: "Metallic Steel" },
  { value: "metallic-copper", label: "Metallic Copper" },
  { value: "metallic-titanium", label: "Metallic Titanium" },
  { value: "metallic-rose-gold", label: "Metallic Rose Gold" },
  { value: "metallic-gunmetal", label: "Metallic Gunmetal" },
  // Papercut
  { value: "papercut-coral", label: "Papercut Coral" },
  { value: "papercut-sky", label: "Papercut Sky" },
  { value: "papercut-mint", label: "Papercut Mint" },
  { value: "papercut-lavender", label: "Papercut Lavender" },
  { value: "papercut-peach", label: "Papercut Peach" },
  // Basic
  { value: "default", label: "Default" },
];

export function toManualWeight(w: string): number {
  const weightMap: Record<string, number> = {
    "tier-gold": 1,
    "tier-diamond": 2,
    "tier-prismatic": 3,
    "tier-obsidian": 4,
    "gradient-emerald": 5,
    "gradient-sapphire": 6,
    "gradient-ruby": 7,
    "gradient-amethyst": 8,
    "gradient-gold": 9,
    neu: 10,
    holo: 11,
    sketch: 12,
    newspaper: 13,
    "neon-cyan": 14,
    "neon-pink": 15,
    "neon-green": 16,
    "neon-purple": 17,
    "neon-gold": 18,
    "metallic-steel": 19,
    "metallic-copper": 20,
    "metallic-titanium": 21,
    "metallic-rose-gold": 22,
    "metallic-gunmetal": 23,
    "papercut-coral": 24,
    "papercut-sky": 25,
    "papercut-mint": 26,
    "papercut-lavender": 27,
    "papercut-peach": 28,
    default: 100,
  };
  return weightMap[w] ?? 100;
}
