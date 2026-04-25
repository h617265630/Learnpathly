import { useEffect, useState, useCallback } from "react";
import { listMyResources, type DbResource } from "@/services/resource";

// ─── Types ───
type DemoCard = {
  id: number;
  title: string;
  summary: string;
  category: string;
  platform: string;
  type: string;
  thumbnail: string;
  weight?: string;
  tier?: string;
  accentColor?: string;
};

type CardStyleEntry = {
  style: string;
  variant: string;
  color: string;
  bg: string;
};

// ─── Demo Data ───
const demoData: DemoCard[] = [
  {
    id: 1,
    title: "Building LLMs from Scratch",
    summary:
      "Complete guide on training large language models with PyTorch and custom datasets.",
    category: "AI",
    platform: "YouTube",
    type: "video",
    thumbnail: "",
  },
  {
    id: 2,
    title: "Vue 3 Composition API Deep Dive",
    summary:
      "Master Vue 3 reactivity system, composables, and advanced patterns.",
    category: "Frontend",
    platform: "Medium",
    type: "article",
    thumbnail: "",
  },
  {
    id: 3,
    title: "FastAPI Production Architecture",
    summary:
      "Building scalable REST APIs with async handlers, middleware, and dependency injection.",
    category: "Backend",
    platform: "GitHub",
    type: "document",
    thumbnail: "",
  },
  {
    id: 4,
    title: "Figma Auto Layout Masterclass",
    summary:
      "Advanced responsive design with constraints, auto-layout, and component variants.",
    category: "Design",
    platform: "YouTube",
    type: "video",
    thumbnail: "",
  },
  {
    id: 5,
    title: "Tailwind CSS Component Patterns",
    summary:
      "Reusable UI component patterns with Tailwind CSS utility-first approach.",
    category: "UI",
    platform: "Dev.to",
    type: "article",
    thumbnail: "",
  },
  {
    id: 6,
    title: "Docker & K8s for Developers",
    summary:
      "Container orchestration, deployment strategies, and CI/CD pipelines.",
    category: "Backend",
    platform: "Substack",
    type: "document",
    thumbnail: "",
  },
  {
    id: 7,
    title: "Prompt Engineering Guide",
    summary:
      "Systematic approaches to crafting effective prompts for GPT, Claude, and Gemini.",
    category: "AI",
    platform: "GitHub",
    type: "document",
    thumbnail: "",
  },
  {
    id: 8,
    title: "Three.js 3D Web Experiences",
    summary:
      "Create immersive 3D web experiences with WebGL, shaders, and physics engines.",
    category: "Frontend",
    platform: "YouTube",
    type: "video",
    thumbnail: "",
  },
];

// ─── Section Data ───
const tierCards = [
  { ...demoData[0], weight: "default" },
  { ...demoData[1], weight: "iron" },
  { ...demoData[2], weight: "bronze" },
  { ...demoData[3], weight: "silver" },
  { ...demoData[4], weight: "gold" },
  { ...demoData[5], weight: "diamond" },
  { ...demoData[6], weight: "prismatic" },
  { ...demoData[7], weight: "obsidian" },
];

const gradientCards = [
  { ...demoData[0], tier: "emerald", accentColor: "#10b981" },
  { ...demoData[1], tier: "sapphire", accentColor: "#3b82f6" },
  { ...demoData[2], tier: "ruby", accentColor: "#ef4444" },
  { ...demoData[3], tier: "amethyst", accentColor: "#8b5cf6" },
  { ...demoData[4], tier: "gold", accentColor: "#eab308" },
];

const glassCards = demoData.slice(0, 5);
const neuCards = demoData.slice(0, 4);
const holoCards = demoData.slice(0, 4);
const neonCards = demoData.slice(0, 5);
const neonColors = [
  { key: "cyan", color: "#00FFFF" },
  { key: "pink", color: "#FF006E" },
  { key: "green", color: "#39FF14" },
  { key: "purple", color: "#BF00FF" },
  { key: "gold", color: "#FFD700" },
];

const brutalistCards = demoData.slice(0, 4);
const brutalistAccents = ["red", "blue", "yellow", "green"];
const brutalistColorMap: Record<string, string> = {
  red: "#FF0000",
  blue: "#0000FF",
  yellow: "#FFD700",
  green: "#00CC00",
};

const auroraCards = demoData.slice(0, 5);
const auroraGradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
];

const retroCards = demoData.slice(0, 5);
const retroAccents = ["green", "amber", "cyan", "red", "white"];
const retroColorMap: Record<string, string> = {
  green: "#39FF14",
  amber: "#FFB000",
  cyan: "#00FFFF",
  red: "#FF3333",
  white: "#E0E0E0",
};

const watercolorCards = demoData.slice(0, 5);
const watercolorBgs = [
  "linear-gradient(160deg, #fce4ec88 0%, #f3e5f588 30%, #e8eaf688 70%, #e0f7fa88 100%)",
  "linear-gradient(160deg, #fff3e088 0%, #fce4ec88 30%, #f3e5f588 70%, #e8eaf688 100%)",
  "linear-gradient(160deg, #e8f5e988 0%, #e0f2f188 30%, #e3f2fd88 70%, #ede7f688 100%)",
  "linear-gradient(160deg, #fff8e188 0%, #ffecb388 30%, #ffe0b288 70%, #ffccbc88 100%)",
  "linear-gradient(160deg, #e1f5fe88 0%, #b3e5fc88 30%, #b2dfdb88 70%, #c8e6c988 100%)",
];
const watercolorDotBgs = [
  "rgba(233,30,99,0.4)",
  "rgba(156,39,176,0.4)",
  "rgba(33,150,243,0.35)",
  "rgba(255,152,0,0.4)",
  "rgba(0,150,136,0.4)",
];

const meshCards = demoData.slice(0, 5);
const meshGradients = [
  "radial-gradient(at 20% 30%, #e879f9 0%, transparent 50%), radial-gradient(at 80% 20%, #38bdf8 0%, transparent 50%), radial-gradient(at 50% 80%, #fb923c 0%, transparent 50%), #1e1b4b",
  "radial-gradient(at 30% 20%, #34d399 0%, transparent 50%), radial-gradient(at 70% 70%, #818cf8 0%, transparent 50%), radial-gradient(at 10% 80%, #f472b6 0%, transparent 50%), #0f172a",
  "radial-gradient(at 80% 30%, #facc15 0%, transparent 50%), radial-gradient(at 20% 70%, #f43f5e 0%, transparent 50%), radial-gradient(at 60% 90%, #a78bfa 0%, transparent 50%), #18181b",
  "radial-gradient(at 40% 10%, #67e8f9 0%, transparent 50%), radial-gradient(at 70% 60%, #c084fc 0%, transparent 50%), radial-gradient(at 20% 90%, #4ade80 0%, transparent 50%), #0c0a09",
  "radial-gradient(at 60% 20%, #fb7185 0%, transparent 50%), radial-gradient(at 30% 80%, #60a5fa 0%, transparent 50%), radial-gradient(at 80% 70%, #fbbf24 0%, transparent 50%), #1c1917",
];

const sketchCards = demoData.slice(0, 5);
const metallicCards = demoData.slice(0, 5);
const metallicTypes = ["steel", "copper", "titanium", "rose-gold", "gunmetal"];
const pixelCards = demoData.slice(0, 5);
const pixelPalette = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA", "#34D399"];
const papercutCards = demoData.slice(0, 5);
const papercutColors = ["coral", "sky", "mint", "lavender", "peach"];
const papercutColorMap: Record<string, string> = {
  coral: "#FF6B6B",
  sky: "#4FC3F7",
  mint: "#66BB6A",
  lavender: "#AB47BC",
  peach: "#FF8A65",
};
const vaporwaveCards = demoData.slice(0, 5);
const vaporwaveBgs = [
  "linear-gradient(135deg, #2d1b6980, #ff6ec740)",
  "linear-gradient(135deg, #1a053380, #01cdfe40)",
  "linear-gradient(135deg, #2d1b6980, #05ffa140)",
  "linear-gradient(135deg, #3d126580, #ff71ce40)",
  "linear-gradient(135deg, #1a053380, #b967ff40)",
];
const newspaperCards = demoData.slice(0, 5);
const frostedCards = demoData.slice(0, 5);
const frostedAccents = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6"];
const origamiCards = demoData.slice(0, 5);
const origamiColors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"];
const glitchCards = demoData.slice(0, 5);
const glitchColors = ["#00ff41", "#ff0040", "#00d4ff", "#fffc00", "#ff00ff"];

// ─── All Styles Pool (for live data) ───
const allStyles: {
  style: string;
  variants: { variant: string; color: string; bg: string }[];
}[] = [
  {
    style: "tier",
    variants: [
      { variant: "gold", color: "#ca8a04", bg: "" },
      { variant: "diamond", color: "#0891b2", bg: "" },
      { variant: "prismatic", color: "#7c3aed", bg: "" },
      { variant: "obsidian", color: "#18181b", bg: "" },
      { variant: "silver", color: "#71717a", bg: "" },
      { variant: "bronze", color: "#d97706", bg: "" },
    ],
  },
  {
    style: "gradient",
    variants: [
      { variant: "emerald", color: "#10b981", bg: "" },
      { variant: "sapphire", color: "#3b82f6", bg: "" },
      { variant: "ruby", color: "#ef4444", bg: "" },
      { variant: "amethyst", color: "#8b5cf6", bg: "" },
      { variant: "gold", color: "#eab308", bg: "" },
    ],
  },
  {
    style: "glass",
    variants: [
      {
        variant: "purple",
        color: "",
        bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      },
      {
        variant: "pink",
        color: "",
        bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      },
      {
        variant: "blue",
        color: "",
        bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      },
      {
        variant: "teal",
        color: "",
        bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      },
    ],
  },
  { style: "neu", variants: [{ variant: "default", color: "", bg: "" }] },
  { style: "holo", variants: [{ variant: "default", color: "", bg: "" }] },
  {
    style: "neon",
    variants: [
      { variant: "cyan", color: "#00FFFF", bg: "" },
      { variant: "pink", color: "#FF006E", bg: "" },
      { variant: "green", color: "#39FF14", bg: "" },
      { variant: "purple", color: "#BF00FF", bg: "" },
      { variant: "gold", color: "#FFD700", bg: "" },
    ],
  },
  {
    style: "brutalist",
    variants: [
      { variant: "red", color: "#FF0000", bg: "" },
      { variant: "blue", color: "#0000FF", bg: "" },
      { variant: "yellow", color: "#FFD700", bg: "" },
      { variant: "green", color: "#00CC00", bg: "" },
    ],
  },
  {
    style: "aurora",
    variants: [
      {
        variant: "a",
        color: "",
        bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      },
      {
        variant: "b",
        color: "",
        bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      },
      {
        variant: "c",
        color: "",
        bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      },
      {
        variant: "d",
        color: "",
        bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      },
      {
        variant: "e",
        color: "",
        bg: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      },
    ],
  },
  {
    style: "retro",
    variants: [
      { variant: "green", color: "#39FF14", bg: "" },
      { variant: "amber", color: "#FFB000", bg: "" },
      { variant: "cyan", color: "#00FFFF", bg: "" },
      { variant: "red", color: "#FF3333", bg: "" },
      { variant: "white", color: "#E0E0E0", bg: "" },
    ],
  },
  {
    style: "watercolor",
    variants: [
      { variant: "rose", color: "#e91e63", bg: "" },
      { variant: "violet", color: "#9c27b0", bg: "" },
      { variant: "ocean", color: "#2196f3", bg: "" },
      { variant: "amber", color: "#ff9800", bg: "" },
      { variant: "teal", color: "#009688", bg: "" },
    ],
  },
  {
    style: "mesh",
    variants: [
      { variant: "sunset", color: "#e879f9", bg: "" },
      { variant: "forest", color: "#34d399", bg: "" },
      { variant: "fire", color: "#f43f5e", bg: "" },
      { variant: "arctic", color: "#67e8f9", bg: "" },
      { variant: "candy", color: "#fb7185", bg: "" },
    ],
  },
  { style: "sketch", variants: [{ variant: "default", color: "", bg: "" }] },
  {
    style: "metallic",
    variants: [
      { variant: "steel", color: "#78909c", bg: "" },
      { variant: "copper", color: "#b87333", bg: "" },
      { variant: "titanium", color: "#607d8b", bg: "" },
      { variant: "rose-gold", color: "#c47f7f", bg: "" },
      { variant: "gunmetal", color: "#6b7b83", bg: "" },
    ],
  },
  {
    style: "pixel",
    variants: [
      { variant: "red", color: "#FF6B6B", bg: "" },
      { variant: "teal", color: "#4ECDC4", bg: "" },
      { variant: "yellow", color: "#FFE66D", bg: "" },
      { variant: "purple", color: "#A78BFA", bg: "" },
      { variant: "green", color: "#34D399", bg: "" },
    ],
  },
  {
    style: "papercut",
    variants: [
      { variant: "coral", color: "#FF6B6B", bg: "" },
      { variant: "sky", color: "#4FC3F7", bg: "" },
      { variant: "mint", color: "#66BB6A", bg: "" },
      { variant: "lavender", color: "#AB47BC", bg: "" },
      { variant: "peach", color: "#FF8A65", bg: "" },
    ],
  },
  {
    style: "vaporwave",
    variants: [
      { variant: "pink", color: "#ff71ce", bg: "" },
      { variant: "cyan", color: "#01cdfe", bg: "" },
      { variant: "green", color: "#05ffa1", bg: "" },
      { variant: "purple", color: "#b967ff", bg: "" },
      { variant: "yellow", color: "#fffb96", bg: "" },
    ],
  },
  {
    style: "newspaper",
    variants: [{ variant: "default", color: "#1a1a1a", bg: "" }],
  },
  {
    style: "frosted",
    variants: [
      { variant: "indigo", color: "#6366f1", bg: "" },
      { variant: "pink", color: "#ec4899", bg: "" },
      { variant: "teal", color: "#14b8a6", bg: "" },
      { variant: "amber", color: "#f59e0b", bg: "" },
      { variant: "violet", color: "#8b5cf6", bg: "" },
    ],
  },
  {
    style: "origami",
    variants: [
      { variant: "red", color: "#e74c3c", bg: "" },
      { variant: "blue", color: "#3498db", bg: "" },
      { variant: "green", color: "#2ecc71", bg: "" },
      { variant: "orange", color: "#f39c12", bg: "" },
      { variant: "purple", color: "#9b59b6", bg: "" },
    ],
  },
  {
    style: "glitch",
    variants: [
      { variant: "matrix", color: "#00ff41", bg: "" },
      { variant: "danger", color: "#ff0040", bg: "" },
      { variant: "ice", color: "#00d4ff", bg: "" },
      { variant: "electric", color: "#fffc00", bg: "" },
      { variant: "neon", color: "#ff00ff", bg: "" },
    ],
  },
];

// ─── Helper Functions ───
function shufflePool<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function assignRandomStyles(
  resources: DbResource[]
): Record<number, CardStyleEntry> {
  const pool: CardStyleEntry[] = [];
  for (const sg of allStyles) {
    for (const v of sg.variants) {
      pool.push({ style: sg.style, ...v });
    }
  }
  const shuffled = shufflePool(pool);
  const map: Record<number, CardStyleEntry> = {};
  for (let i = 0; i < resources.length; i++) {
    map[resources[i].id] = shuffled[i % shuffled.length];
  }
  return map;
}

function tierClass(weight: string): string {
  const map: Record<string, string> = {
    default: "border border-stone-200 bg-stone-50",
    iron: "border border-slate-300 bg-slate-50",
    bronze: "border-2 border-amber-400 bg-amber-50",
    silver:
      "border-2 border-zinc-300 bg-gradient-to-br from-zinc-50 to-zinc-100",
    gold: "tier-gold",
    diamond: "tier-diamond",
    prismatic: "tier-prismatic",
    obsidian: "tier-obsidian",
  };
  return map[weight] || "border border-stone-200 bg-white";
}

function tierBadgeStyle(weight: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    default: { backgroundColor: "#a8a29e20", color: "#78716c" },
    iron: { backgroundColor: "#64748b20", color: "#475569" },
    bronze: { backgroundColor: "#f59e0b20", color: "#d97706" },
    silver: { backgroundColor: "#a1a1aa20", color: "#71717a" },
    gold: { backgroundColor: "#eab30830", color: "#ca8a04" },
    diamond: { backgroundColor: "#06b6d420", color: "#0891b2" },
    prismatic: {
      background: "linear-gradient(90deg, #ec489930, #8b5cf630)",
      color: "#7c3aed",
    },
    obsidian: { backgroundColor: "#18181b", color: "#a1a1aa" },
  };
  return map[weight] || {};
}

function tierAccent(weight: string): string {
  const map: Record<string, string> = {
    default: "#78716c",
    iron: "#475569",
    bronze: "#d97706",
    silver: "#71717a",
    gold: "#ca8a04",
    diamond: "#0891b2",
    prismatic: "#7c3aed",
    obsidian: "#18181b",
  };
  return map[weight] || "#3b82f6";
}

function metallicBadge(type: string): React.CSSProperties {
  const m: Record<string, React.CSSProperties> = {
    steel: { backgroundColor: "#b0bec530", color: "#78909c" },
    copper: { backgroundColor: "#d4845630", color: "#b87333" },
    titanium: { backgroundColor: "#b0bec520", color: "#607d8b" },
    "rose-gold": { backgroundColor: "#e8b4b830", color: "#c47f7f" },
    gunmetal: { backgroundColor: "#45505520", color: "#6b7b83" },
  };
  return m[type] || {};
}

function metallicTextMain(type: string): string {
  const m: Record<string, string> = {
    steel: "#e0e0e0",
    copper: "#f5d5b8",
    titanium: "#cfd8dc",
    "rose-gold": "#f5d5d5",
    gunmetal: "#c0c8cc",
  };
  return m[type] || "#e0e0e0";
}

function metallicTextSub(type: string): string {
  const m: Record<string, string> = {
    steel: "#90a4ae",
    copper: "#b87333aa",
    titanium: "#78909c",
    "rose-gold": "#c47f7faa",
    gunmetal: "#78909c",
  };
  return m[type] || "#90a4ae";
}

function metallicIconStyle(type: string): React.CSSProperties {
  const m: Record<string, React.CSSProperties> = {
    steel: {
      background: "linear-gradient(180deg, #cfd8dc, #78909c)",
      color: "#263238",
    },
    copper: {
      background: "linear-gradient(180deg, #e8b88a, #b87333)",
      color: "#3e2723",
    },
    titanium: {
      background: "linear-gradient(180deg, #b0bec5, #546e7a)",
      color: "#eceff1",
    },
    "rose-gold": {
      background: "linear-gradient(180deg, #f5d5d5, #c47f7f)",
      color: "#3e2723",
    },
    gunmetal: {
      background: "linear-gradient(180deg, #78909c, #37474f)",
      color: "#eceff1",
    },
  };
  return m[type] || {};
}

// ─── Card Components ───

function CardInner({
  card,
  children,
  className = "",
}: {
  card: DemoCard;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`h-full flex flex-col overflow-hidden ${className}`}>
      <div className="px-3 py-2 flex items-center justify-between border-b border-black/10">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
          {card.category}
        </span>
        <span className="text-xs text-stone-400">
          #{String(card.id).padStart(3, "0")}
        </span>
      </div>
      <div className="relative h-28 bg-stone-100 overflow-hidden flex items-center justify-center">
        {card.thumbnail ? (
          <img
            src={card.thumbnail}
            alt={card.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-lg font-bold text-stone-500">
            {card.title.charAt(0)}
          </div>
        )}
      </div>
      <div className="px-3 py-2 border-b border-black/10 bg-white">
        <h3 className="text-sm font-bold text-stone-900 line-clamp-1">
          {card.title}
        </h3>
      </div>
      <div className="px-3 py-2 flex-1 bg-stone-50">
        <p className="text-xs text-stone-500 line-clamp-2">{card.summary}</p>
      </div>
      <div className="px-3 py-2 border-t border-black/10 flex items-center justify-between">
        <span className="text-xs text-stone-400">{card.platform}</span>
        <span className="text-xs font-medium text-stone-600">{card.type}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Section Wrapper ───
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-sm font-medium tracking-[0.14em] uppercase text-stone-600">
          {title}
        </h2>
        <p className="text-sm text-stone-400 mt-1">{description}</p>
      </div>
      <div className="flex flex-wrap gap-6">{children}</div>
    </section>
  );
}

// ─── Tier Card ───
function TierCard({ card }: { card: DemoCard }) {
  return (
    <div
      className={`shrink-0 w-56 h-72 rounded-md shadow-sm cursor-pointer transition-all duration-300 hover:scale-105 ${tierClass(
        card.weight || "default"
      )}`}
    >
      <CardInner card={card} />
    </div>
  );
}

// ─── Gradient Card ───
function GradientCard({ card, idx }: { card: DemoCard; idx: number }) {
  const tier = card.tier || "emerald";
  return (
    <div
      className={`shrink-0 w-56 h-72 rounded-lg cursor-pointer transition-all duration-500 gradient-card gradient-${tier}`}
    >
      <div className="h-full flex flex-col overflow-hidden rounded-lg bg-white m-[2px]">
        <div className="px-3 py-2 flex items-center justify-between">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: card.accentColor }}
          >
            {tier}
          </span>
          <span className="text-xs text-stone-400">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 bg-stone-100 overflow-hidden flex items-center justify-center">
          {card.thumbnail ? (
            <img
              src={card.thumbnail}
              alt={card.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
              style={{ background: card.accentColor }}
            >
              {card.title.charAt(0)}
            </div>
          )}
        </div>
        <div className="px-3 py-2 bg-white">
          <h3 className="text-sm font-bold text-stone-900 line-clamp-1">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-2 flex-1">
          <p className="text-xs text-stone-500 line-clamp-2">{card.summary}</p>
        </div>
        <div className="px-3 py-2 border-t border-stone-200/30 flex items-center justify-between">
          <span className="text-xs text-stone-400">{card.platform}</span>
          <span
            className="text-xs font-medium"
            style={{ color: card.accentColor }}
          >
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Glass Card ───
function GlassCard({ card }: { card: DemoCard }) {
  return (
    <div
      className="shrink-0 w-56 h-72 rounded-xl cursor-pointer transition-all duration-300 glass-card hover:scale-105 hover:shadow-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
      }}
    >
      <div className="h-full flex flex-col overflow-hidden rounded-xl">
        <div className="px-3 py-2 flex items-center justify-between border-b border-white/10">
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-white/20 text-white backdrop-blur-sm">
            {card.category}
          </span>
          <span className="text-xs text-white/60">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden px-2 py-1">
          {card.thumbnail ? (
            <img
              src={card.thumbnail}
              alt={card.title}
              className="w-full h-full object-cover rounded-md opacity-90"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xl font-bold text-white">
                {card.title.charAt(0)}
              </div>
            </div>
          )}
        </div>
        <div className="px-3 py-2 border-b border-white/10">
          <h3 className="text-sm font-bold text-white line-clamp-1">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-2 flex-1">
          <p className="text-xs text-white/70 line-clamp-2">{card.summary}</p>
        </div>
        <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/60">{card.platform}</span>
          <span className="text-xs font-medium text-white/90">{card.type}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Neu Card ───
function NeuCard({ card }: { card: DemoCard }) {
  return (
    <div className="shrink-0 w-56 h-72 rounded-2xl cursor-pointer transition-all duration-300 neu-card hover:scale-[1.03]">
      <div className="h-full flex flex-col overflow-hidden rounded-2xl">
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="px-2 py-0.5 text-xs font-medium rounded-full neu-badge">
            {card.category}
          </span>
          <span className="text-xs text-stone-400">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden px-3 py-1">
          {card.thumbnail ? (
            <img
              src={card.thumbnail}
              alt={card.title}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded-xl neu-icon">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {card.title.charAt(0)}
              </div>
            </div>
          )}
        </div>
        <div className="px-3 py-2">
          <h3 className="text-sm font-bold text-stone-700 line-clamp-1">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-1 flex-1">
          <p className="text-xs text-stone-500 line-clamp-2">{card.summary}</p>
        </div>
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-stone-400">{card.platform}</span>
          <span className="text-xs font-medium text-stone-600">
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Holo Card ───
function HoloCard({ card }: { card: DemoCard }) {
  return (
    <div className="shrink-0 w-56 h-72 rounded-lg cursor-pointer transition-all duration-300 holo-card hover:scale-105">
      <div className="h-full flex flex-col overflow-hidden rounded-lg bg-white relative z-10">
        <div className="px-3 py-2 border-b border-stone-200/50 flex items-center justify-between">
          <span className="px-2 py-0.5 text-xs font-bold rounded holo-badge">
            {card.category}
          </span>
          <span className="text-xs text-stone-400">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden px-2">
          {card.thumbnail ? (
            <img
              src={card.thumbnail}
              alt={card.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 rounded-full holo-badge flex items-center justify-center text-xl font-bold text-white">
                {card.title.charAt(0)}
              </div>
            </div>
          )}
        </div>
        <div className="px-3 py-2 border-b border-stone-200/50">
          <h3 className="text-sm font-bold text-stone-900 line-clamp-1">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-2 flex-1">
          <p className="text-xs text-stone-500 line-clamp-2">{card.summary}</p>
        </div>
        <div className="px-3 py-2 border-t border-stone-200/50 flex items-center justify-between">
          <span className="text-xs text-stone-400">{card.platform}</span>
          <span className="text-xs font-medium text-stone-600">
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Neon Card ───
function NeonCard({ card, idx }: { card: DemoCard; idx: number }) {
  const neon = neonColors[idx % neonColors.length];
  return (
    <div
      className={`shrink-0 w-56 h-72 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 neon-card-${neon.key}`}
    >
      <div className="h-full flex flex-col overflow-hidden rounded-lg">
        <div
          className="px-3 py-2 flex items-center justify-between border-b"
          style={{ borderColor: neon.color + "30" }}
        >
          <span
            className="px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider neon-text"
            style={{ color: neon.color }}
          >
            {card.category}
          </span>
          <span className="text-xs text-stone-500">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden px-2 py-1 flex items-center justify-center">
          {card.thumbnail ? (
            <img
              src={card.thumbnail}
              alt={card.title}
              className="w-full h-full object-cover rounded opacity-80"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold neon-icon"
              style={{
                color: neon.color,
                border: `2px solid ${neon.color}`,
                boxShadow: `0 0 15px ${neon.color}40, inset 0 0 15px ${neon.color}20`,
              }}
            >
              {card.title.charAt(0)}
            </div>
          )}
        </div>
        <div className="px-3 py-2">
          <h3 className="text-sm font-bold text-stone-100 line-clamp-1">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-1 flex-1">
          <p className="text-xs text-stone-400 line-clamp-2">{card.summary}</p>
        </div>
        <div
          className="px-3 py-2 border-t flex items-center justify-between"
          style={{ borderColor: neon.color + "20" }}
        >
          <span className="text-xs text-stone-500">{card.platform}</span>
          <span className="text-xs font-medium" style={{ color: neon.color }}>
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Brutalist Card ───
function BrutalistCard({ card, idx }: { card: DemoCard; idx: number }) {
  const accent = brutalistAccents[idx % brutalistAccents.length];
  const color = brutalistColorMap[accent];
  return (
    <div
      className={`shrink-0 w-56 h-72 cursor-pointer transition-all duration-200 brutalist-card`}
      style={{ border: "3px solid #000", boxShadow: "6px 6px 0px #000" }}
    >
      <div className="h-full flex flex-col overflow-hidden bg-white">
        <div className="px-3 py-2 border-b-2 border-black flex items-center justify-between">
          <span
            className="px-2 py-0.5 text-xs font-black uppercase tracking-wider text-white"
            style={{ background: color }}
          >
            {card.category}
          </span>
          <span className="text-xs font-mono font-bold">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden bg-stone-100 border-b-2 border-black flex items-center justify-center">
          {card.thumbnail ? (
            <img
              src={card.thumbnail}
              alt={card.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-14 h-14 flex items-center justify-center text-2xl font-black text-white"
              style={{ background: color }}
            >
              {card.title.charAt(0)}
            </div>
          )}
        </div>
        <div className="px-3 py-2 border-b-2 border-black bg-white">
          <h3 className="text-sm font-black text-black uppercase line-clamp-1">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-2 flex-1">
          <p className="text-xs text-stone-700 line-clamp-2 font-mono">
            {card.summary}
          </p>
        </div>
        <div className="px-3 py-2 border-t-2 border-black flex items-center justify-between">
          <span className="text-xs font-bold text-black uppercase">
            {card.platform}
          </span>
          <span className="text-xs font-bold" style={{ color }}>
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Aurora Card ───
function AuroraCard({ card, idx }: { card: DemoCard; idx: number }) {
  return (
    <div
      className="shrink-0 w-56 h-72 rounded-2xl cursor-pointer transition-all duration-500 hover:scale-105 aurora-card overflow-hidden"
      style={{ background: auroraGradients[idx % auroraGradients.length] }}
    >
      <div className="h-full flex flex-col overflow-hidden rounded-2xl backdrop-blur-sm bg-white/5">
        <div className="px-3 py-2 flex items-center justify-between border-b border-white/10">
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white/15 text-white backdrop-blur-md">
            {card.category}
          </span>
          <span className="text-xs text-white/50">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden px-2 py-1 flex items-center justify-center">
          {card.thumbnail ? (
            <img
              src={card.thumbnail}
              alt={card.title}
              className="w-full h-full object-cover rounded-xl opacity-85"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-xl font-bold text-white border border-white/20">
              {card.title.charAt(0)}
            </div>
          )}
        </div>
        <div className="px-3 py-2 border-b border-white/10">
          <h3 className="text-sm font-bold text-white line-clamp-1">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-1 flex-1">
          <p className="text-xs text-white/65 line-clamp-2">{card.summary}</p>
        </div>
        <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/50">{card.platform}</span>
          <span className="text-xs font-medium text-white/80">{card.type}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Retro Card ───
function RetroCard({ card, idx }: { card: DemoCard; idx: number }) {
  const accent = retroAccents[idx % retroAccents.length];
  const color = retroColorMap[accent];
  return (
    <div
      className={`shrink-0 w-56 h-72 cursor-pointer transition-all duration-300 retro-card retro-${accent}`}
    >
      <div className="h-full flex flex-col overflow-hidden font-mono">
        <div
          className="px-3 py-2 flex items-center justify-between border-b"
          style={{ borderColor: color + "40" }}
        >
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color, textShadow: `0 0 6px ${color}80` }}
          >
            {">"} {card.category}
          </span>
          <span className="text-xs" style={{ color: color + "60" }}>
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div
          className="relative h-28 overflow-hidden flex items-center justify-center border-b"
          style={{ borderColor: color + "20" }}
        >
          <div className="text-6xl font-black" style={{ color: color + "30" }}>
            {card.title.charAt(0)}
          </div>
        </div>
        <div className="px-3 py-2">
          <h3 className="text-sm font-bold line-clamp-1" style={{ color }}>
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-1 flex-1">
          <p className="text-xs line-clamp-2" style={{ color: color + "80" }}>
            {card.summary}
          </p>
        </div>
        <div
          className="px-3 py-2 border-t flex items-center justify-between"
          style={{ borderColor: color + "30" }}
        >
          <span className="text-xs" style={{ color: color + "60" }}>
            {card.platform}
          </span>
          <span className="text-xs blink-cursor" style={{ color }}>
            {card.type}_
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Watercolor Card ───
function WatercolorCard({ card, idx }: { card: DemoCard; idx: number }) {
  return (
    <div
      className="shrink-0 w-56 h-72 rounded-3xl cursor-pointer transition-all duration-500 watercolor-card hover:scale-105 overflow-hidden"
      style={{ background: watercolorBgs[idx % watercolorBgs.length] }}
    >
      <div className="h-full flex flex-col overflow-hidden rounded-3xl">
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white/40 text-stone-700 backdrop-blur-sm">
            {card.category}
          </span>
          <span className="text-xs text-stone-500/60">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden px-4 py-1 flex items-center justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-light text-white"
            style={{
              background: watercolorDotBgs[idx % watercolorDotBgs.length],
            }}
          >
            {card.title.charAt(0)}
          </div>
        </div>
        <div className="px-4 py-2">
          <h3
            className="text-sm font-semibold text-stone-800 line-clamp-1"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {card.title}
          </h3>
        </div>
        <div className="px-4 py-1 flex-1">
          <p
            className="text-xs text-stone-600/80 line-clamp-2"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {card.summary}
          </p>
        </div>
        <div className="px-4 py-2 flex items-center justify-between">
          <span
            className="text-xs text-stone-500/70"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {card.platform}
          </span>
          <span
            className="text-xs font-medium text-stone-600"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Mesh Card ───
function MeshCard({ card, idx }: { card: DemoCard; idx: number }) {
  return (
    <div
      className="shrink-0 w-56 h-72 rounded-2xl cursor-pointer transition-all duration-500 hover:scale-105 mesh-card overflow-hidden"
      style={{ background: meshGradients[idx % meshGradients.length] }}
    >
      <div className="h-full flex flex-col overflow-hidden rounded-2xl backdrop-blur-xs">
        <div className="px-3 py-2 flex items-center justify-between border-b border-white/15">
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-black/20 text-white backdrop-blur uppercase tracking-wider">
            {card.category}
          </span>
          <span className="text-xs text-white/40">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden px-2 py-1 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl font-bold text-white border border-white/20 shadow-lg">
            {card.title.charAt(0)}
          </div>
        </div>
        <div className="px-3 py-2 border-b border-white/10">
          <h3 className="text-sm font-bold text-white line-clamp-1 drop-shadow-sm">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-1 flex-1">
          <p className="text-xs text-white/60 line-clamp-2">{card.summary}</p>
        </div>
        <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/40">{card.platform}</span>
          <span className="text-xs font-medium text-white/70">{card.type}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sketch Card ───
function SketchCard({ card }: { card: DemoCard }) {
  return (
    <div className="shrink-0 w-56 h-72 cursor-pointer transition-all duration-300 sketch-card hover:rotate-1 hover:scale-105">
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between border-b-2 border-dashed border-stone-400">
          <span className="px-2 py-0.5 text-xs font-bold rounded-sm bg-yellow-100 text-stone-700 sketch-font">
            {card.category}
          </span>
          <span className="text-xs text-stone-400 sketch-font">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden flex items-center justify-center border-b-2 border-dashed border-stone-300">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#aaa"
              strokeWidth="2"
              strokeDasharray="6,3"
            />
            <text
              x="32"
              y="38"
              textAnchor="middle"
              fill="#888"
              fontSize="22"
              fontFamily="Comic Sans MS, cursive"
            >
              {card.title.charAt(0)}
            </text>
          </svg>
        </div>
        <div className="px-3 py-2 border-b border-dashed border-stone-200">
          <h3 className="text-sm font-bold text-stone-700 line-clamp-1 sketch-font">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-2 flex-1">
          <p className="text-xs text-stone-500 line-clamp-2 sketch-font">
            {card.summary}
          </p>
        </div>
        <div className="px-3 py-2 flex items-center justify-between border-t-2 border-dashed border-stone-400">
          <span className="text-xs text-stone-400 sketch-font">
            {card.platform}
          </span>
          <span className="text-xs font-bold text-stone-600 sketch-font">
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Metallic Card ───
function MetallicCard({ card, idx }: { card: DemoCard; idx: number }) {
  const type = metallicTypes[idx % metallicTypes.length];
  return (
    <div
      className={`shrink-0 w-56 h-72 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 metallic-${type}`}
    >
      <div className="h-full flex flex-col overflow-hidden rounded-lg metallic-inner">
        <div className="px-3 py-2 flex items-center justify-between border-b border-white/10">
          <span
            className="px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider"
            style={metallicBadge(type)}
          >
            {card.category}
          </span>
          <span className="text-xs" style={{ color: metallicTextSub(type) }}>
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden px-2 py-1 flex items-center justify-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black metallic-icon"
            style={metallicIconStyle(type)}
          >
            {card.title.charAt(0)}
          </div>
        </div>
        <div className="px-3 py-2 border-b border-white/10">
          <h3
            className="text-sm font-bold line-clamp-1"
            style={{ color: metallicTextMain(type) }}
          >
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-1 flex-1">
          <p
            className="text-xs line-clamp-2"
            style={{ color: metallicTextSub(type) }}
          >
            {card.summary}
          </p>
        </div>
        <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs" style={{ color: metallicTextSub(type) }}>
            {card.platform}
          </span>
          <span
            className="text-xs font-bold"
            style={{ color: metallicTextMain(type) }}
          >
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Pixel Card ───
function PixelCard({ card, idx }: { card: DemoCard; idx: number }) {
  const color = pixelPalette[idx % pixelPalette.length];
  return (
    <div
      className="shrink-0 w-56 h-72 cursor-pointer transition-all duration-200 pixel-card hover:translate-y-[-4px]"
      style={{
        border: `4px solid ${color}`,
        boxShadow: `4px 4px 0px ${color}80`,
      }}
    >
      <div
        className="h-full flex flex-col overflow-hidden pixel-font"
        style={{
          fontFamily: "'Courier New', monospace",
          imageRendering: "pixelated",
        }}
      >
        <div
          className="px-3 py-2 flex items-center justify-between border-b-4"
          style={{ borderColor: color + "60", background: color + "15" }}
        >
          <span className="text-xs font-bold uppercase" style={{ color }}>
            {card.category}
          </span>
          <span className="text-xs text-stone-400">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden flex items-center justify-center bg-stone-900">
          <div
            className="text-5xl font-black pixel-bounce"
            style={{ color, textShadow: `3px 3px 0px ${color}40` }}
          >
            {card.title.charAt(0)}
          </div>
        </div>
        <div className="px-3 py-2 bg-stone-900">
          <h3 className="text-sm font-bold text-stone-100 line-clamp-1">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-1 flex-1 bg-stone-900">
          <p className="text-xs text-stone-400 line-clamp-2">{card.summary}</p>
        </div>
        <div
          className="px-3 py-2 border-t-4 flex items-center justify-between bg-stone-900"
          style={{ borderColor: color + "40" }}
        >
          <span className="text-xs text-stone-500">{card.platform}</span>
          <span className="text-xs font-bold" style={{ color }}>
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Papercut Card ───
function PapercutCard({ card, idx }: { card: DemoCard; idx: number }) {
  const colorKey = papercutColors[idx % papercutColors.length];
  const color = papercutColorMap[colorKey];
  return (
    <div
      className={`shrink-0 w-56 h-72 cursor-pointer transition-all duration-300 papercut-card papercut-${colorKey}`}
    >
      <div className="h-full flex flex-col overflow-hidden rounded-sm bg-white relative z-10">
        <div
          className="px-3 py-2 flex items-center justify-between border-b"
          style={{ borderColor: color + "40" }}
        >
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color }}
          >
            {card.category}
          </span>
          <span className="text-xs text-stone-400">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden flex items-center justify-center bg-stone-50">
          {card.thumbnail ? (
            <img
              src={card.thumbnail}
              alt={card.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: color }}
            >
              {card.title.charAt(0)}
            </div>
          )}
        </div>
        <div className="px-3 py-2">
          <h3 className="text-sm font-bold text-stone-800 line-clamp-1">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-1 flex-1">
          <p className="text-xs text-stone-500 line-clamp-2">{card.summary}</p>
        </div>
        <div className="px-3 py-2 border-t border-stone-200 flex items-center justify-between">
          <span className="text-xs text-stone-400">{card.platform}</span>
          <span className="text-xs font-medium" style={{ color }}>
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Vaporwave Card ───
function VaporwaveCard({ card, idx }: { card: DemoCard; idx: number }) {
  return (
    <div
      className="shrink-0 w-56 h-72 rounded-lg cursor-pointer transition-all duration-300 vaporwave-card overflow-hidden"
      style={{ background: vaporwaveBgs[idx % vaporwaveBgs.length] }}
    >
      <div className="h-full flex flex-col overflow-hidden rounded-lg relative">
        <div className="px-3 py-2 flex items-center justify-between border-b border-pink-300/30">
          <span
            className="text-xs font-bold uppercase tracking-widest text-cyan-300"
            style={{ textShadow: "0 0 8px #00ffff80" }}
          >
            {card.category}
          </span>
          <span className="text-xs text-pink-300/60">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden flex items-center justify-center">
          <span
            className="text-5xl font-black text-transparent bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #ff71ce, #01cdfe, #05ffa1)",
              WebkitBackgroundClip: "text",
            }}
          >
            {card.title.charAt(0)}
          </span>
        </div>
        <div className="px-3 py-2">
          <h3 className="text-sm font-bold text-pink-200 line-clamp-1">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-1 flex-1">
          <p className="text-xs text-purple-300/70 line-clamp-2">
            {card.summary}
          </p>
        </div>
        <div className="px-3 py-2 border-t border-pink-300/20 flex items-center justify-between">
          <span className="text-xs text-cyan-400/60">{card.platform}</span>
          <span className="text-xs font-bold text-pink-300">{card.type}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Newspaper Card ───
function NewspaperCard({ card }: { card: DemoCard }) {
  return (
    <div className="shrink-0 w-56 h-72 cursor-pointer transition-all duration-300 newspaper-card">
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
      >
        <div className="px-3 py-2 flex items-center justify-between border-b-2 border-black">
          <span className="text-xs font-bold uppercase tracking-[0.2em]">
            {card.category}
          </span>
          <span className="text-xs text-stone-500 italic">
            No.{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden flex items-center justify-center border-b border-stone-300">
          <span
            className="text-6xl font-black text-stone-800"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {card.title.charAt(0)}
          </span>
        </div>
        <div className="px-3 py-2 border-b border-stone-300">
          <h3 className="text-sm font-bold text-stone-900 line-clamp-1 leading-tight">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-1 flex-1">
          <p
            className="text-xs text-stone-600 line-clamp-3 leading-relaxed"
            style={{ textAlign: "justify" }}
          >
            {card.summary}
          </p>
        </div>
        <div className="px-3 py-2 border-t-2 border-black flex items-center justify-between">
          <span className="text-xs text-stone-500 italic">{card.platform}</span>
          <span className="text-xs font-bold uppercase tracking-widest">
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Frosted Card ───
function FrostedCard({ card, idx }: { card: DemoCard; idx: number }) {
  const accent = frostedAccents[idx % frostedAccents.length];
  return (
    <div
      className="shrink-0 w-56 h-72 rounded-xl cursor-pointer transition-all duration-300 frosted-card"
      style={{ "--frost-accent": accent } as React.CSSProperties}
    >
      <div className="h-full flex flex-col overflow-hidden rounded-xl">
        <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: accent }}
          >
            {card.category}
          </span>
          <span className="text-xs text-stone-500">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden flex items-center justify-center">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold text-white/90"
            style={{
              background: accent + "30",
              border: `1px solid ${accent}40`,
            }}
          >
            {card.title.charAt(0)}
          </div>
        </div>
        <div className="px-3 py-2">
          <h3 className="text-sm font-bold text-stone-200 line-clamp-1">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-1 flex-1">
          <p className="text-xs text-stone-400 line-clamp-2">{card.summary}</p>
        </div>
        <div className="px-3 py-2 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-stone-500">{card.platform}</span>
          <span className="text-xs font-medium" style={{ color: accent }}>
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Origami Card ───
function OrigamiCard({ card, idx }: { card: DemoCard; idx: number }) {
  const color = origamiColors[idx % origamiColors.length];
  return (
    <div
      className="shrink-0 w-56 h-72 cursor-pointer transition-all duration-300 origami-card"
      style={{ "--origami-color": color } as React.CSSProperties}
    >
      <div className="h-full flex flex-col overflow-hidden bg-white relative z-10">
        <div className="px-3 py-2 flex items-center justify-between border-b border-stone-200">
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color }}
          >
            {card.category}
          </span>
          <span className="text-xs text-stone-400">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden flex items-center justify-center bg-stone-50">
          <div
            className="w-12 h-12 flex items-center justify-center text-xl font-bold text-white"
            style={{
              background: color,
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            }}
          >
            {card.title.charAt(0)}
          </div>
        </div>
        <div className="px-3 py-2 border-b border-stone-100">
          <h3 className="text-sm font-bold text-stone-800 line-clamp-1">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-1 flex-1">
          <p className="text-xs text-stone-500 line-clamp-2">{card.summary}</p>
        </div>
        <div className="px-3 py-2 border-t border-stone-200 flex items-center justify-between">
          <span className="text-xs text-stone-400">{card.platform}</span>
          <span className="text-xs font-medium" style={{ color }}>
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Glitch Card ───
function GlitchCard({ card, idx }: { card: DemoCard; idx: number }) {
  const color = glitchColors[idx % glitchColors.length];
  return (
    <div
      className="shrink-0 w-56 h-72 cursor-pointer transition-all duration-300 glitch-card"
      style={{ "--glitch-color": color } as React.CSSProperties}
    >
      <div className="h-full flex flex-col overflow-hidden rounded-sm bg-stone-900 relative">
        <div className="px-3 py-2 flex items-center justify-between border-b border-stone-800">
          <span
            className="text-xs font-bold uppercase tracking-widest font-mono glitch-text"
            style={{ color }}
          >
            {card.category}
          </span>
          <span className="text-xs text-stone-600 font-mono">
            #{String(card.id).padStart(3, "0")}
          </span>
        </div>
        <div className="relative h-28 overflow-hidden flex items-center justify-center bg-black">
          <span
            className="text-5xl font-black font-mono glitch-text"
            style={{ color, textShadow: "2px 0 #ff0000, -2px 0 #00ffff" }}
          >
            {card.title.charAt(0)}
          </span>
        </div>
        <div className="px-3 py-2 bg-stone-900">
          <h3 className="text-sm font-bold text-stone-200 line-clamp-1 font-mono">
            {card.title}
          </h3>
        </div>
        <div className="px-3 py-1 flex-1 bg-stone-900">
          <p className="text-xs text-stone-500 line-clamp-2 font-mono">
            {card.summary}
          </p>
        </div>
        <div className="px-3 py-2 border-t border-stone-800 flex items-center justify-between bg-stone-900">
          <span className="text-xs text-stone-600 font-mono">
            {card.platform}
          </span>
          <span className="text-xs font-bold font-mono" style={{ color }}>
            {card.type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Live Resource Card (renders based on random style) ───
function LiveResourceCard({
  resource,
  style,
}: {
  resource: DbResource;
  style: CardStyleEntry;
}) {
  const color = style.color;
  const bg = style.bg;

  const renderContent = () => (
    <>
      <div className="px-3 py-2 flex items-center justify-between">
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: color || "#6b7280" }}
        >
          {resource.category_name || resource.platform}
        </span>
        <span className="text-xs text-stone-400">
          #{String(resource.id).padStart(3, "0")}
        </span>
      </div>
      <div className="relative h-28 bg-stone-100 overflow-hidden flex items-center justify-center">
        {resource.thumbnail ? (
          <img
            src={resource.thumbnail}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
            style={{ background: color || "#6b7280" }}
          >
            {(resource.title || "R").charAt(0)}
          </div>
        )}
      </div>
      <div className="px-3 py-2 bg-white">
        <h3 className="text-sm font-bold text-stone-900 line-clamp-1">
          {resource.title}
        </h3>
      </div>
      <div className="px-3 py-2 flex-1 bg-stone-50">
        <p className="text-xs text-stone-500 line-clamp-2">
          {resource.summary || "No description"}
        </p>
      </div>
      <div className="px-3 py-2 border-t border-stone-200 flex items-center justify-between">
        <span className="text-xs text-stone-400">{resource.platform}</span>
        <span
          className="text-xs font-medium"
          style={{ color: color || "#6b7280" }}
        >
          {resource.resource_type}
        </span>
      </div>
    </>
  );

  if (style.style === "tier") {
    return (
      <div
        className={`w-full h-72 rounded-md cursor-pointer transition-all duration-300 hover:scale-105 ${tierClass(
          style.variant
        )}`}
      >
        <div className="h-full flex flex-col overflow-hidden rounded-md">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "gradient") {
    return (
      <div
        className={`w-full h-72 rounded-lg cursor-pointer transition-all duration-500 gradient-card gradient-${style.variant}`}
      >
        <div className="h-full flex flex-col overflow-hidden rounded-lg bg-white m-[2px]">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "glass") {
    return (
      <div
        className="w-full h-72 rounded-xl cursor-pointer transition-all duration-300 glass-card hover:scale-105 overflow-hidden"
        style={{ background: bg }}
      >
        <div className="h-full flex flex-col overflow-hidden rounded-xl backdrop-blur-md bg-white/8">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "neu") {
    return (
      <div className="w-full h-72 rounded-2xl cursor-pointer transition-all duration-300 neu-card hover:scale-[1.03]">
        <div className="h-full flex flex-col overflow-hidden rounded-2xl">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "holo") {
    return (
      <div className="w-full h-72 rounded-lg cursor-pointer transition-all duration-300 holo-card hover:scale-105">
        <div className="h-full flex flex-col overflow-hidden rounded-lg bg-white relative z-10">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "neon") {
    return (
      <div
        className={`w-full h-72 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 neon-card-${style.variant}`}
      >
        <div className="h-full flex flex-col overflow-hidden rounded-lg">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "brutalist") {
    return (
      <div
        className="w-full h-72 cursor-pointer transition-all duration-200 brutalist-card"
        style={{ border: "3px solid #000", boxShadow: "6px 6px 0px #000" }}
      >
        <div className="h-full flex flex-col overflow-hidden bg-white">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "aurora") {
    return (
      <div
        className="w-full h-72 rounded-2xl cursor-pointer transition-all duration-500 hover:scale-105 aurora-card overflow-hidden"
        style={{ background: bg }}
      >
        <div className="h-full flex flex-col overflow-hidden rounded-2xl backdrop-blur-sm bg-white/5">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "retro") {
    return (
      <div
        className={`w-full h-72 cursor-pointer transition-all duration-300 retro-card overflow-hidden retro-${style.variant}`}
      >
        <div className="h-full flex flex-col overflow-hidden font-mono">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "watercolor") {
    return (
      <div
        className="w-full h-72 rounded-2xl cursor-pointer transition-all duration-500 hover:scale-105 watercolor-card overflow-hidden"
        style={{ background: watercolorBgs[0] }}
      >
        <div className="h-full flex flex-col overflow-hidden rounded-2xl">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "mesh") {
    return (
      <div
        className="w-full h-72 rounded-xl cursor-pointer transition-all duration-500 hover:scale-105 mesh-card overflow-hidden"
        style={{ background: meshGradients[0] }}
      >
        <div className="h-full flex flex-col overflow-hidden rounded-xl">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "sketch") {
    return (
      <div className="w-full h-72 cursor-pointer transition-all duration-300 sketch-card hover:scale-[1.03] overflow-hidden">
        <div className="h-full flex flex-col overflow-hidden">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "metallic") {
    return (
      <div
        className={`w-full h-72 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 metallic-${style.variant}`}
      >
        <div className="h-full flex flex-col overflow-hidden rounded-lg">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "pixel") {
    return (
      <div
        className="w-full h-72 cursor-pointer transition-all duration-200 pixel-card overflow-hidden"
        style={{ borderColor: color }}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "papercut") {
    return (
      <div
        className={`w-full h-72 cursor-pointer transition-all duration-300 papercut-card papercut-${style.variant}`}
      >
        <div className="h-full flex flex-col overflow-hidden rounded-sm bg-white relative z-10">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "vaporwave") {
    return (
      <div
        className="w-full h-72 rounded-lg cursor-pointer transition-all duration-300 vaporwave-card overflow-hidden"
        style={{ background: vaporwaveBgs[0] }}
      >
        <div className="h-full flex flex-col overflow-hidden rounded-lg relative">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "newspaper") {
    return (
      <div className="w-full h-72 cursor-pointer transition-all duration-300 newspaper-card overflow-hidden">
        <div className="h-full flex flex-col overflow-hidden">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "frosted") {
    return (
      <div
        className="w-full h-72 rounded-xl cursor-pointer transition-all duration-300 frosted-card overflow-hidden"
        style={{ "--frost-accent": color } as React.CSSProperties}
      >
        <div className="h-full flex flex-col overflow-hidden rounded-xl">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "origami") {
    return (
      <div
        className="w-full h-72 cursor-pointer transition-all duration-300 origami-card overflow-hidden"
        style={{ "--origami-color": color } as React.CSSProperties}
      >
        <div className="h-full flex flex-col overflow-hidden bg-white relative z-10">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (style.style === "glitch") {
    return (
      <div
        className="w-full h-72 cursor-pointer transition-all duration-300 glitch-card overflow-hidden"
        style={{ "--glitch-color": color } as React.CSSProperties}
      >
        <div className="h-full flex flex-col overflow-hidden rounded-sm bg-stone-900 relative">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-72 rounded-md bg-white border border-stone-200 cursor-pointer hover:scale-105 transition-all">
      <div className="h-full flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function CardUI() {
  const [loading, setLoading] = useState(false);
  const [liveResources, setLiveResources] = useState<DbResource[]>([]);
  const [cardStyleMap, setCardStyleMap] = useState<
    Record<number, CardStyleEntry>
  >({});

  const reshuffleStyles = useCallback(() => {
    assignRandomStyles(liveResources);
    setCardStyleMap(assignRandomStyles(liveResources));
  }, [liveResources]);

  useEffect(() => {
    setLoading(true);
    listMyResources()
      .then((raw) => {
        const doubled: DbResource[] = [];
        for (const r of raw) {
          doubled.push(r);
          doubled.push({ ...r, id: r.id + 900000 });
        }
        setLiveResources(doubled);
        setCardStyleMap(assignRandomStyles(doubled));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <style>{`
        /* Tier: Gold */
        .tier-gold { background: linear-gradient(135deg, #fef3c7, #fef9c3, #fef3c7); border: 2px solid transparent; position: relative; }
        .tier-gold::before { content: ''; position: absolute; inset: -2px; border-radius: inherit; background: linear-gradient(45deg, #FFD700, #FFF8DC, #DAA520, #FFD700); background-size: 300% 300%; animation: gold-shimmer 3s ease infinite; z-index: -1; }
        @keyframes gold-shimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

        /* Tier: Diamond */
        .tier-diamond { background: linear-gradient(135deg, #ecfeff, #f0f9ff, #ecfeff); border: 2px solid transparent; position: relative; box-shadow: 0 0 15px rgba(6, 182, 212, 0.15), 0 0 30px rgba(6, 182, 212, 0.08); }
        .tier-diamond::before { content: ''; position: absolute; inset: -2px; border-radius: inherit; background: linear-gradient(45deg, #67e8f9, #a5f3fc, #22d3ee, #06b6d4, #67e8f9); background-size: 400% 400%; animation: diamond-pulse 4s ease infinite; z-index: -1; }
        @keyframes diamond-pulse { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

        /* Tier: Prismatic */
        .tier-prismatic { background: linear-gradient(135deg, #faf5ff, #fdf2f8, #eff6ff, #faf5ff); border: 2px solid transparent; position: relative; }
        .tier-prismatic::before { content: ''; position: absolute; inset: -2px; border-radius: inherit; background: conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444); animation: prismatic-spin 6s linear infinite; z-index: -1; }
        @keyframes prismatic-spin { from { filter: hue-rotate(0deg); } to { filter: hue-rotate(360deg); } }

        /* Tier: Obsidian */
        .tier-obsidian { background: linear-gradient(135deg, #18181b, #27272a, #18181b); border: 2px solid #3f3f46; box-shadow: 0 0 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05); }

        /* Gradient Border Cards */
        .gradient-card { position: relative; }
        .gradient-card::before { content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 2px; background-size: 300% 300%; animation: gradient-border-flow 4s ease infinite; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
        .gradient-emerald::before { background: linear-gradient(45deg, #10b981, #34d399, #6ee7b7, #10b981); }
        .gradient-sapphire::before { background: linear-gradient(45deg, #2563eb, #3b82f6, #93c5fd, #2563eb); }
        .gradient-ruby::before { background: linear-gradient(45deg, #dc2626, #ef4444, #fca5a5, #dc2626); }
        .gradient-amethyst::before { background: linear-gradient(45deg, #7c3aed, #8b5cf6, #c4b5fd, #7c3aed); }
        .gradient-gold::before { background: linear-gradient(45deg, #ca8a04, #eab308, #fde68a, #ca8a04); }
        @keyframes gradient-border-flow { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .gradient-card:hover { box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12); transform: translateY(-4px); }

        /* Glass Card */
        .glass-card { background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); }
        .glass-card:hover { background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.25); }

        /* Neumorphism Card */
        .neu-card { background: #e8e8e8; box-shadow: 8px 8px 16px #c8c8c8, -8px -8px 16px #ffffff; }
        .neu-card:hover { box-shadow: 4px 4px 8px #c8c8c8, -4px -4px 8px #ffffff, inset 2px 2px 4px #c8c8c8, inset -2px -2px 4px #ffffff; }
        .neu-badge { background: #e8e8e8; color: #64748b; box-shadow: inset 2px 2px 4px #c8c8c8, inset -2px -2px 4px #ffffff; }
        .neu-icon { box-shadow: inset 4px 4px 8px #c8c8c8, inset -4px -4px 8px #ffffff; }

        /* Holographic Card */
        .holo-card { position: relative; overflow: hidden; border: 2px solid transparent; background-clip: padding-box; }
        .holo-card::before { content: ''; position: absolute; inset: -2px; border-radius: inherit; background: linear-gradient(45deg, #ff000040, #ff880040, #ffff0040, #00ff0040, #00ffff40, #0000ff40, #ff00ff40, #ff000040); background-size: 400% 400%; animation: holo-shift 6s linear infinite; z-index: -1; }
        .holo-card::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(120deg, transparent 30%, rgba(255, 255, 255, 0.4) 50%, transparent 70%); mix-blend-mode: overlay; pointer-events: none; z-index: 20; animation: holo-shine 4s ease-in-out infinite; }
        @keyframes holo-shift { 0% { background-position: 0% 50%; } 100% { background-position: 400% 50%; } }
        @keyframes holo-shine { 0%, 100% { opacity: 0.3; transform: translateX(-100%); } 50% { opacity: 0.6; transform: translateX(100%); } }
        .holo-badge { background: linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 700; }

        /* Neon Cards */
        .neon-card-cyan { background: #0a0e27; border: 1px solid #00FFFF30; box-shadow: 0 0 10px #00FFFF10, inset 0 0 10px #00FFFF05; }
        .neon-card-cyan:hover { box-shadow: 0 0 20px #00FFFF25, 0 0 40px #00FFFF10; border-color: #00FFFF60; }
        .neon-card-pink { background: #0a0e27; border: 1px solid #FF006E30; box-shadow: 0 0 10px #FF006E10, inset 0 0 10px #FF006E05; }
        .neon-card-pink:hover { box-shadow: 0 0 20px #FF006E25, 0 0 40px #FF006E10; border-color: #FF006E60; }
        .neon-card-green { background: #0a0e27; border: 1px solid #39FF1430; box-shadow: 0 0 10px #39FF1410, inset 0 0 10px #39FF1405; }
        .neon-card-green:hover { box-shadow: 0 0 20px #39FF1425, 0 0 40px #39FF1410; border-color: #39FF1460; }
        .neon-card-purple { background: #0a0e27; border: 1px solid #BF00FF30; box-shadow: 0 0 10px #BF00FF10, inset 0 0 10px #BF00FF05; }
        .neon-card-purple:hover { box-shadow: 0 0 20px #BF00FF25, 0 0 40px #BF00FF10; border-color: #BF00FF60; }
        .neon-card-gold { background: #0a0e27; border: 1px solid #FFD70030; box-shadow: 0 0 10px #FFD70010, inset 0 0 10px #FFD70005; }
        .neon-card-gold:hover { box-shadow: 0 0 20px #FFD70025, 0 0 40px #FFD70010; border-color: #FFD70060; }
        .neon-text { text-shadow: 0 0 8px currentColor; }
        .neon-icon { filter: drop-shadow(0 0 8px currentColor); }

        /* Brutalist Card */
        .brutalist-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .brutalist-card:hover { transform: translate(-3px, -3px); box-shadow: 9px 9px 0px #000 !important; }
        .brutalist-card:active { transform: translate(0, 0); box-shadow: 3px 3px 0px #000 !important; }

        /* Aurora Card */
        .aurora-card { position: relative; }
        .aurora-card::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(120deg, transparent 20%, rgba(255, 255, 255, 0.15) 45%, transparent 65%); pointer-events: none; animation: aurora-wave 5s ease-in-out infinite; }
        @keyframes aurora-wave { 0%, 100% { transform: translateX(-50%) rotate(-5deg); } 50% { transform: translateX(50%) rotate(5deg); } }

        /* Retro Card */
        .retro-card { background: #0d0208; border: 1px solid; position: relative; overflow: hidden; }
        .retro-card::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.15) 2px, rgba(0, 0, 0, 0.15) 4px); pointer-events: none; z-index: 1; }
        .retro-card::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.5) 100%); pointer-events: none; z-index: 2; }
        .retro-green { border-color: #39FF1440; box-shadow: 0 0 8px #39FF1415, inset 0 0 30px #39FF1408; }
        .retro-amber { border-color: #FFB00040; box-shadow: 0 0 8px #FFB00015, inset 0 0 30px #FFB00008; }
        .retro-cyan { border-color: #00FFFF40; box-shadow: 0 0 8px #00FFFF15, inset 0 0 30px #00FFFF08; }
        .retro-red { border-color: #FF333340; box-shadow: 0 0 8px #FF333315, inset 0 0 30px #FF333308; }
        .retro-white { border-color: #E0E0E040; box-shadow: 0 0 8px #E0E0E015, inset 0 0 30px #E0E0E008; }
        .retro-card:hover { transform: scale(1.04); }
        .blink-cursor { animation: blink 1s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }

        /* Watercolor Card */
        .watercolor-card { border: none; position: relative; box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05); }
        .watercolor-card::before { content: ''; position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(ellipse at 25% 25%, rgba(255,255,255,0.5) 0%, transparent 60%); pointer-events: none; z-index: 1; }
        .watercolor-card:hover { box-shadow: 0 6px 30px rgba(0, 0, 0, 0.1); }

        /* Mesh Card */
        .mesh-card { position: relative; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3); }
        .mesh-card::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.08) 50%, transparent 70%); pointer-events: none; animation: mesh-shimmer 4s ease-in-out infinite; }
        @keyframes mesh-shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
        .mesh-card:hover { box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4); border-color: rgba(255, 255, 255, 0.2); }

        /* Sketch Card */
        .sketch-card { background: #fefefe; border: 2px solid #d1d5db; position: relative; box-shadow: 2px 2px 0 #e5e7eb; }
        .sketch-card::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 23px, #e5e7eb40 23px, #e5e7eb40 24px); pointer-events: none; z-index: 0; }
        .sketch-card:hover { box-shadow: 4px 4px 0 #d1d5db; border-color: #9ca3af; }
        .sketch-font { font-family: 'Comic Sans MS', cursive, sans-serif; }

        /* Metallic Cards */
        .metallic-steel { background: linear-gradient(145deg, #37474f, #546e7a, #455a64, #37474f); border: 1px solid #607d8b40; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
        .metallic-copper { background: linear-gradient(145deg, #5d4037, #795548, #6d4c41, #5d4037); border: 1px solid #b8733340; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08); }
        .metallic-titanium { background: linear-gradient(145deg, #455a64, #607d8b, #546e7a, #455a64); border: 1px solid #78909c40; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12); }
        .metallic-rose-gold { background: linear-gradient(145deg, #5d4037, #6d4c41, #5d4037); border: 1px solid #c47f7f30; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 200, 200, 0.1); }
        .metallic-gunmetal { background: linear-gradient(145deg, #263238, #37474f, #2c393f, #263238); border: 1px solid #45505530; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05); }
        [class^="metallic-"]:hover { box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15); }

        /* Pixel Card */
        .pixel-card { background: #1a1a2e; border: 4px solid; image-rendering: pixelated; box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5); }
        .pixel-card:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.5); }
        .pixel-card:active { transform: translate(0, 0); box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5); }
        .pixel-bounce { display: inline-block; animation: pixel-float 2s ease-in-out infinite; }
        @keyframes pixel-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .pixel-font { font-family: 'Press Start 2P', 'Courier New', monospace; }

        /* Papercut Card */
        .papercut-card { position: relative; }
        .papercut-card::before, .papercut-card::after { content: ''; position: absolute; inset: 0; border-radius: 2px; background: white; }
        .papercut-card::before { transform: rotate(2deg) translate(3px, 3px); z-index: 1; box-shadow: 1px 1px 4px rgba(0,0,0,0.08); }
        .papercut-card::after { transform: rotate(-1.5deg) translate(-2px, 2px); z-index: 2; box-shadow: 1px 1px 3px rgba(0,0,0,0.06); }
        .papercut-card > div { z-index: 10; position: relative; }
        .papercut-coral::before { background: #FF6B6B15; }
        .papercut-coral::after { background: #FF6B6B08; }
        .papercut-sky::before { background: #4FC3F715; }
        .papercut-sky::after { background: #4FC3F708; }
        .papercut-mint::before { background: #66BB6A15; }
        .papercut-mint::after { background: #66BB6A08; }
        .papercut-lavender::before { background: #AB47BC15; }
        .papercut-lavender::after { background: #AB47BC08; }
        .papercut-peach::before { background: #FF8A6515; }
        .papercut-peach::after { background: #FF8A6508; }
        .papercut-card:hover { transform: translateY(-4px); }
        .papercut-card:hover::before { transform: rotate(3deg) translate(5px, 5px); }
        .papercut-card:hover::after { transform: rotate(-2.5deg) translate(-4px, 4px); }

        /* Vaporwave Card */
        .vaporwave-card { border: 1px solid rgba(255, 110, 199, 0.3); position: relative; overflow: hidden; }
        .vaporwave-card::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255, 110, 199, 0.03) 3px, rgba(255, 110, 199, 0.03) 4px); pointer-events: none; z-index: 1; }
        .vaporwave-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 40%; background: repeating-linear-gradient(90deg, rgba(1, 205, 254, 0.08) 0px, transparent 1px, transparent 20px, rgba(1, 205, 254, 0.08) 20px), repeating-linear-gradient(0deg, rgba(1, 205, 254, 0.06) 0px, transparent 1px, transparent 20px, rgba(1, 205, 254, 0.06) 20px); perspective: 200px; transform: rotateX(45deg); transform-origin: bottom; pointer-events: none; z-index: 0; }
        .vaporwave-card:hover { border-color: rgba(255, 110, 199, 0.6); box-shadow: 0 0 20px rgba(255, 110, 199, 0.15), 0 0 40px rgba(1, 205, 254, 0.1); transform: scale(1.05); }

        /* Newspaper Card */
        .newspaper-card { background: #f5f0e8; border: 1px solid #d4c5a9; position: relative; box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.1); }
        .newspaper-card::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0, 0, 0, 0.015) 1px, rgba(0, 0, 0, 0.015) 2px); pointer-events: none; }
        .newspaper-card:hover { transform: translateY(-3px) rotate(-0.5deg); box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.15); }

        /* Frosted Card */
        .frosted-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.06); border-left: 3px solid var(--frost-accent, #6366f1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
        .frosted-card:hover { background: rgba(255, 255, 255, 0.06); border-left-width: 4px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4); transform: scale(1.04); }

        /* Origami Card */
        .origami-card { position: relative; background: white; box-shadow: 2px 2px 8px rgba(0,0,0,0.1); }
        .origami-card::before { content: ''; position: absolute; top: 0; right: 0; width: 0; height: 0; border-style: solid; border-width: 0 32px 32px 0; border-color: transparent var(--origami-color, #e74c3c) transparent transparent; z-index: 20; opacity: 0.7; transition: all 0.3s ease; }
        .origami-card::after { content: ''; position: absolute; top: 0; right: 32px; width: 0; height: 0; border-style: solid; border-width: 0 0 32px 0; border-color: transparent transparent rgba(0,0,0,0.08) transparent; z-index: 19; }
        .origami-card:hover { transform: translateY(-4px); box-shadow: 4px 4px 16px rgba(0,0,0,0.15); }
        .origami-card:hover::before { border-width: 0 40px 40px 0; }

        /* Glitch Card */
        .glitch-card { background: #111; border: 1px solid #333; position: relative; overflow: hidden; }
        .glitch-card::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 2px; background: var(--glitch-color, #00ff41); opacity: 0.6; animation: glitch-scan 3s linear infinite; z-index: 10; }
        @keyframes glitch-scan { 0% { top: 0; left: -100%; } 50% { left: 100%; } 50.1% { top: 100%; left: -100%; } 100% { left: 100%; } }
        .glitch-card:hover { animation: glitch-shake 0.3s ease; border-color: var(--glitch-color, #00ff41); box-shadow: 0 0 10px var(--glitch-color, #00ff41), inset 0 0 10px rgba(0,0,0,0.5); }
        @keyframes glitch-shake { 0%, 100% { transform: translate(0); } 20% { transform: translate(-2px, 1px); } 40% { transform: translate(2px, -1px); } 60% { transform: translate(-1px, -2px); } 80% { transform: translate(1px, 2px); } }
        .glitch-text { position: relative; }
        .glitch-card:hover .glitch-text { animation: glitch-text-flicker 0.4s ease; }
        @keyframes glitch-text-flicker { 0%, 100% { opacity: 1; } 33% { opacity: 0.8; transform: translateX(1px); } 66% { opacity: 0.9; transform: translateX(-1px); } }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-12">
        {/* Section 1: Weight Tier */}
        <Section
          title="Weight Tier System"
          description="Gradient border effects ranked by importance level"
        >
          {tierCards.map((card) => (
            <TierCard key={card.id} card={card} />
          ))}
        </Section>

        {/* Section 2: Gradient Border */}
        <Section
          title="Gradient Border Effects"
          description="Animated gradient borders with glow effects"
        >
          {gradientCards.map((card, idx) => (
            <GradientCard key={card.id} card={card} idx={idx} />
          ))}
        </Section>

        {/* Section 3: Glassmorphism */}
        <Section
          title="Glassmorphism"
          description="Frosted glass effect with translucent layers"
        >
          {glassCards.map((card) => (
            <GlassCard key={card.id} card={card} />
          ))}
        </Section>

        {/* Section 4: Neumorphism */}
        <Section title="Neumorphism" description="Soft UI with embossed depth">
          <div className="rounded-xl p-8 bg-stone-200">
            <div className="flex flex-wrap gap-6">
              {neuCards.map((card) => (
                <NeuCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        </Section>

        {/* Section 5: Holographic */}
        <Section
          title="Holographic"
          description="Rainbow shimmer with prismatic light effects"
        >
          {holoCards.map((card) => (
            <HoloCard key={card.id} card={card} />
          ))}
        </Section>

        {/* Section 6: Cyberpunk Neon */}
        <Section
          title="Cyberpunk Neon"
          description="Dark theme with neon glow accents"
        >
          <div className="rounded-xl p-8 bg-stone-950">
            <div className="flex flex-wrap gap-6">
              {neonCards.map((card, idx) => (
                <NeonCard key={card.id} card={card} idx={idx} />
              ))}
            </div>
          </div>
        </Section>

        {/* Section 7: Brutalist */}
        <Section
          title="Brutalist"
          description="Raw, bold, unapologetic design with hard shadows"
        >
          {brutalistCards.map((card, idx) => (
            <BrutalistCard key={card.id} card={card} idx={idx} />
          ))}
        </Section>

        {/* Section 8: Aurora */}
        <Section
          title="Aurora Liquid"
          description="Flowing gradients with Northern Lights atmosphere"
        >
          {auroraCards.map((card, idx) => (
            <AuroraCard key={card.id} card={card} idx={idx} />
          ))}
        </Section>

        {/* Section 9: Retro Terminal */}
        <Section
          title="Retro Terminal"
          description="CRT scanline aesthetic with phosphor glow"
        >
          <div className="rounded-xl p-8 bg-stone-950">
            <div className="flex flex-wrap gap-6">
              {retroCards.map((card, idx) => (
                <RetroCard key={card.id} card={card} idx={idx} />
              ))}
            </div>
          </div>
        </Section>

        {/* Section 10: Watercolor */}
        <Section
          title="Watercolor"
          description="Soft ink wash with organic edges and translucent layers"
        >
          {watercolorCards.map((card, idx) => (
            <WatercolorCard key={card.id} card={card} idx={idx} />
          ))}
        </Section>

        {/* Section 11: Mesh Gradient */}
        <Section
          title="Mesh Gradient"
          description="Multi-point color mesh with organic blob shapes"
        >
          {meshCards.map((card, idx) => (
            <MeshCard key={card.id} card={card} idx={idx} />
          ))}
        </Section>

        {/* Section 12: Sketch */}
        <Section
          title="Sketch / Wireframe"
          description="Hand-drawn pencil sketch aesthetic with wobbly borders"
        >
          {sketchCards.map((card) => (
            <SketchCard key={card.id} card={card} />
          ))}
        </Section>

        {/* Section 13: Metallic */}
        <Section
          title="Metallic"
          description="Brushed steel and chrome with reflective surfaces"
        >
          {metallicCards.map((card, idx) => (
            <MetallicCard key={card.id} card={card} idx={idx} />
          ))}
        </Section>

        {/* Section 14: Pixel Art */}
        <Section
          title="Pixel Art / 8-bit"
          description="Retro gaming pixel aesthetic with chunky borders"
        >
          <div className="rounded-xl p-8 bg-stone-900">
            <div className="flex flex-wrap gap-6">
              {pixelCards.map((card, idx) => (
                <PixelCard key={card.id} card={card} idx={idx} />
              ))}
            </div>
          </div>
        </Section>

        {/* Section 15: Paper Cut */}
        <Section
          title="Paper Cut / Layered"
          description="Multi-layer paper shadow effect with pastel tones"
        >
          <div className="rounded-xl bg-stone-100 p-8">
            <div className="flex flex-wrap gap-6">
              {papercutCards.map((card, idx) => (
                <PapercutCard key={card.id} card={card} idx={idx} />
              ))}
            </div>
          </div>
        </Section>

        {/* Section 16: Vaporwave */}
        <Section
          title="Vaporwave / Retrowave"
          description="80s/90s aesthetic with pink-cyan gradients and grid lines"
        >
          <div
            className="rounded-xl p-8"
            style={{
              background:
                "linear-gradient(180deg, #1a0533 0%, #2d1b69 50%, #ff6ec7 100%)",
            }}
          >
            <div className="flex flex-wrap gap-6">
              {vaporwaveCards.map((card, idx) => (
                <VaporwaveCard key={card.id} card={card} idx={idx} />
              ))}
            </div>
          </div>
        </Section>

        {/* Section 17: Newspaper */}
        <Section
          title="Newspaper / Gazette"
          description="Classic print media typographic style"
        >
          <div className="rounded-xl p-8 bg-stone-100">
            <div className="flex flex-wrap gap-6">
              {newspaperCards.map((card) => (
                <NewspaperCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        </Section>

        {/* Section 18: Frosted Dark */}
        <Section
          title="Frosted Dark"
          description="Dark frosted glass with colored accent borders"
        >
          <div
            className="rounded-xl p-8"
            style={{
              background:
                "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
            }}
          >
            <div className="flex flex-wrap gap-6">
              {frostedCards.map((card, idx) => (
                <FrostedCard key={card.id} card={card} idx={idx} />
              ))}
            </div>
          </div>
        </Section>

        {/* Section 19: Origami */}
        <Section
          title="Origami / Fold"
          description="Paper fold effect with diagonal shadow crease"
        >
          <div className="rounded-xl bg-stone-100 p-8">
            <div className="flex flex-wrap gap-6">
              {origamiCards.map((card, idx) => (
                <OrigamiCard key={card.id} card={card} idx={idx} />
              ))}
            </div>
          </div>
        </Section>

        {/* Section 20: Glitch */}
        <Section
          title="Glitch / Distorted"
          description="Digital glitch effect with RGB split and scan artifacts"
        >
          <div className="rounded-xl p-8 bg-stone-950">
            <div className="flex flex-wrap gap-6">
              {glitchCards.map((card, idx) => (
                <GlitchCard key={card.id} card={card} idx={idx} />
              ))}
            </div>
          </div>
        </Section>

        {/* Section 21: Live Resources */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium tracking-[0.14em] uppercase text-stone-600">
                My Resources — Random Styles
              </h2>
              <p className="text-sm text-stone-400 mt-1">
                Resources doubled, each card gets a unique UI style from all 20
                styles
              </p>
            </div>
            <button
              onClick={reshuffleStyles}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-stone-300 bg-white text-stone-600 hover:bg-stone-50 transition rounded-sm"
            >
              Reshuffle
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin border-2 border-stone-600 border-t-transparent rounded-full" />
              <p className="mt-3 text-sm text-stone-400">
                Loading resources...
              </p>
            </div>
          ) : liveResources.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-stone-400">
                No resources found. Add some from the My Resources page.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {liveResources.map((r) =>
                cardStyleMap[r.id] ? (
                  <LiveResourceCard
                    key={r.id}
                    resource={r}
                    style={cardStyleMap[r.id]}
                  />
                ) : null
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
