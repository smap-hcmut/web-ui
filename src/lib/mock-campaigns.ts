import type { Platform } from "./mock-data";

/* ── Data hierarchy: Campaign > Project > Keyword ── */

export interface Keyword {
  id: string;
  text: string;               // e.g. "#chientranh"
  platforms: Platform[];
  volume: number;
  sentiment: number;           // 0-100
}

export interface Project {
  id: string;
  name: string;
  keywords: Keyword[];
}

export interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "completed";
  projects: Project[];
}

/* ── Mock campaigns ── */
export const campaigns: Campaign[] = [
  {
    id: "camp-1",
    name: "Iran Conflict Monitoring",
    status: "active",
    projects: [
      {
        id: "proj-1a",
        name: "War & Geopolitics",
        keywords: [
          { id: "kw-1", text: "#chientranh", platforms: ["tiktok", "facebook", "youtube"], volume: 145300, sentiment: 32 },
          { id: "kw-2", text: "#iran", platforms: ["tiktok", "youtube"], volume: 89900, sentiment: 28 },
          { id: "kw-3", text: "#israel", platforms: ["tiktok", "youtube"], volume: 5400, sentiment: 25 },
          { id: "kw-4", text: "#tinquocte", platforms: ["tiktok", "facebook"], volume: 8950, sentiment: 45 },
        ],
      },
      {
        id: "proj-1b",
        name: "Breaking News",
        keywords: [
          { id: "kw-5", text: "#tinnong24h", platforms: ["tiktok", "facebook"], volume: 42800, sentiment: 40 },
          { id: "kw-6", text: "#dongdat", platforms: ["tiktok", "facebook", "youtube"], volume: 23400, sentiment: 22 },
          { id: "kw-7", text: "#socialnews", platforms: ["tiktok", "facebook", "youtube"], volume: 6200, sentiment: 55 },
        ],
      },
    ],
  },
  {
    id: "camp-2",
    name: "Entertainment & Culture",
    status: "active",
    projects: [
      {
        id: "proj-2a",
        name: "Music & Artists",
        keywords: [
          { id: "kw-8", text: "#phungkhanhlinh", platforms: ["tiktok", "youtube"], volume: 12500, sentiment: 88 },
          { id: "kw-9", text: "#camonnguoidathuccungtoi", platforms: ["tiktok"], volume: 18290, sentiment: 92 },
        ],
      },
      {
        id: "proj-2b",
        name: "Gaming",
        keywords: [
          { id: "kw-10", text: "#gta6", platforms: ["tiktok", "youtube"], volume: 67000, sentiment: 85 },
          { id: "kw-11", text: "#esportsvn", platforms: ["tiktok", "youtube"], volume: 11200, sentiment: 78 },
          { id: "kw-12", text: "#reviewphim", platforms: ["tiktok", "youtube"], volume: 12300, sentiment: 72 },
        ],
      },
      {
        id: "proj-2c",
        name: "Sports",
        keywords: [
          { id: "kw-13", text: "#doituyenvietnam", platforms: ["tiktok", "facebook", "youtube"], volume: 89000, sentiment: 90 },
        ],
      },
    ],
  },
  {
    id: "camp-3",
    name: "Tech & Innovation",
    status: "active",
    projects: [
      {
        id: "proj-3a",
        name: "AI & Tech",
        keywords: [
          { id: "kw-14", text: "#AI", platforms: ["tiktok", "facebook", "youtube"], volume: 25600, sentiment: 70 },
          { id: "kw-15", text: "#ChatGPT", platforms: ["tiktok", "facebook"], volume: 19800, sentiment: 68 },
          { id: "kw-16", text: "#iphone17", platforms: ["tiktok", "youtube"], volume: 34500, sentiment: 75 },
        ],
      },
      {
        id: "proj-3b",
        name: "VinFast & EV",
        keywords: [
          { id: "kw-17", text: "#VinFast", platforms: ["tiktok", "facebook", "youtube"], volume: 28700, sentiment: 65 },
        ],
      },
    ],
  },
  {
    id: "camp-4",
    name: "Social Trends",
    status: "paused",
    projects: [
      {
        id: "proj-4a",
        name: "Youth & Mental Health",
        keywords: [
          { id: "kw-18", text: "#genz", platforms: ["tiktok", "facebook"], volume: 9800, sentiment: 48 },
          { id: "kw-19", text: "#mentalhealth", platforms: ["tiktok", "facebook", "youtube"], volume: 7600, sentiment: 42 },
        ],
      },
      {
        id: "proj-4b",
        name: "Education",
        keywords: [
          { id: "kw-20", text: "#tuyensinh2026", platforms: ["tiktok", "facebook"], volume: 15400, sentiment: 55 },
        ],
      },
    ],
  },
];

