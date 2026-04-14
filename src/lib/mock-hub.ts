import type { Platform } from './mock-data';

export interface HubCampaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  dateRange: { start: string; end: string };
  totalMentions: number;
  sentiment: number; // 0-100
  projectCount: number;
  platforms: Platform[];
  sparkline: number[]; // last 7 days
  createdAt: string;
}

export const hubCampaigns: HubCampaign[] = [
  {
    id: 'camp-1',
    name: 'Iran Conflict Monitoring',
    description: 'Track geopolitical discourse and breaking news around Iran-Israel tensions',
    status: 'active',
    dateRange: { start: '2026-03-01', end: '2026-06-30' },
    totalMentions: 315400,
    sentiment: 32,
    projectCount: 2,
    platforms: ['tiktok', 'facebook', 'youtube'],
    sparkline: [42, 55, 48, 62, 58, 71, 67],
    createdAt: '2026-03-01',
  },
  {
    id: 'camp-2',
    name: 'Entertainment & Culture',
    description: 'Music, gaming, and sports social conversation tracking',
    status: 'active',
    dateRange: { start: '2026-02-15', end: '2026-08-15' },
    totalMentions: 210290,
    sentiment: 85,
    projectCount: 3,
    platforms: ['tiktok', 'youtube'],
    sparkline: [80, 82, 78, 85, 90, 88, 92],
    createdAt: '2026-02-15',
  },
  {
    id: 'camp-3',
    name: 'Tech & Innovation',
    description: 'AI, smartphones, EV brands — tech conversation pulse',
    status: 'active',
    dateRange: { start: '2026-01-10', end: '2026-12-31' },
    totalMentions: 108600,
    sentiment: 70,
    projectCount: 2,
    platforms: ['tiktok', 'facebook', 'youtube'],
    sparkline: [50, 55, 60, 58, 65, 62, 68],
    createdAt: '2026-01-10',
  },
  {
    id: 'camp-4',
    name: 'Social Trends',
    description: 'Gen Z, mental health, and education trending topics',
    status: 'paused',
    dateRange: { start: '2026-01-01', end: '2026-04-30' },
    totalMentions: 32800,
    sentiment: 48,
    projectCount: 2,
    platforms: ['tiktok', 'facebook'],
    sparkline: [25, 30, 28, 22, 18, 15, 12],
    createdAt: '2026-01-01',
  },
  {
    id: 'camp-5',
    name: 'Brand Reputation — VinGroup',
    description: 'Owned and earned media monitoring for VinGroup brands',
    status: 'completed',
    dateRange: { start: '2025-10-01', end: '2026-01-31' },
    totalMentions: 186500,
    sentiment: 62,
    projectCount: 4,
    platforms: ['tiktok', 'facebook', 'youtube'],
    sparkline: [70, 65, 60, 55, 50, 48, 45],
    createdAt: '2025-10-01',
  },
];
