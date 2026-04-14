'use client';

import { useState } from 'react';
import {
  Search, Settings, Bell, Download, Trash2, Eye, Heart, Star,
  TrendingUp, Activity, BarChart3, Filter, Hash, Zap, Globe,
  Map, LayoutDashboard, Lightbulb,
} from 'lucide-react';

/* ── Primitives ── */
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import { IconButton } from '@/components/ui/IconButton';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';

/* ── Forms & Filters ── */
import { SearchInput } from '@/components/ui/SearchInput';
import { Dropdown } from '@/components/ui/Dropdown';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { ToggleGroup } from '@/components/ui/ToggleGroup';
import { Checkbox } from '@/components/ui/Checkbox';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { FilterBar } from '@/components/ui/FilterBar';
import { ChipFilter } from '@/components/ui/ChipFilter';

/* ── Data Display ── */
import { DataTable, type Column } from '@/components/ui/DataTable';
import { RankList } from '@/components/ui/RankList';
import { PostCard } from '@/components/cards/PostCard';
import { PlatformOverviewCard } from '@/components/cards/PlatformOverviewCard';
import { KeywordCard } from '@/components/cards/KeywordCard';
import { CampaignCard } from '@/components/cards/CampaignCard';
import { ComparisonCard } from '@/components/cards/ComparisonCard';

/* ── Charts ── */
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { HeatmapGrid } from '@/components/charts/HeatmapGrid';
import { AreaChart } from '@/components/charts/AreaChart';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { RadarChart } from '@/components/charts/RadarChart';
import { FunnelChart } from '@/components/charts/FunnelChart';

/* ── Animated ── */
import { PulseOrb } from '@/components/animated/PulseOrb';
import { FloatingBubbles } from '@/components/animated/FloatingBubbles';
import { GlowCard } from '@/components/animated/GlowCard';
import { WaveBackground } from '@/components/animated/WaveBackground';
import { AnimatedCounter } from '@/components/animated/AnimatedCounter';
import { SentimentPulse } from '@/components/animated/SentimentPulse';
import { TrendArrow } from '@/components/animated/TrendArrow';

/* ── Navigation ── */
import { TabBar } from '@/components/ui/TabBar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CollapsiblePanel } from '@/components/ui/CollapsiblePanel';

/* ── Feedback ── */
import { Modal } from '@/components/ui/Modal';
import { Toast, useToast } from '@/components/ui/Toast';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

/* ── Realtime ── */
import { TimeSlider } from '@/components/ui/TimeSlider';
import { CountdownTimer } from '@/components/ui/CountdownTimer';

/* ═══════════════════════════════════════════
   SHOWCASE PAGE
   ═══════════════════════════════════════════ */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <h2
        className="text-lg font-bold mb-1 tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h2>
      <div className="h-px mb-6" style={{ background: 'var(--border)' }} />
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-[12px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ShowcaseBox({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      {children}
    </div>
  );
}

/* ── NAV LINKS ── */
const NAV_SECTIONS = [
  { id: 'primitives', label: 'Primitives' },
  { id: 'forms', label: 'Forms & Filters' },
  { id: 'data', label: 'Data Display' },
  { id: 'cards', label: 'Cards' },
  { id: 'charts', label: 'Charts' },
  { id: 'animated', label: 'Animated' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'realtime', label: 'Realtime' },
];

export default function ShowcasePage() {
  /* ── Form states ── */
  const [search, setSearch] = useState('');
  const [dropdown, setDropdown] = useState('');
  const [multiSel, setMultiSel] = useState<string[]>(['tiktok']);
  const [dateRange, setDateRange] = useState('7d');
  const [toggle, setToggle] = useState('mentions');
  const [check1, setCheck1] = useState(true);
  const [check2, setCheck2] = useState(false);
  const [radio, setRadio] = useState('mentions');
  const [chips, setChips] = useState([
    { key: 'tiktok', label: 'TikTok', color: '#fe2c55' },
    { key: 'positive', label: 'Positive', color: '#10b981' },
    { key: '7d', label: 'Last 7 days' },
  ]);

  /* ── Navigation states ── */
  const [activeTab, setActiveTab] = useState('posts');

  /* ── Feedback states ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { push: pushToast, ToastContainer } = useToast();

  /* ── Realtime states ── */
  const [sliderVal, setSliderVal] = useState(12);

  /* ── Mock data for charts ── */
  const lineData = [
    { label: 'TikTok', data: [120, 180, 220, 310, 280, 350, 420, 390, 460, 520, 580, 610], color: '#fe2c55' },
    { label: 'Facebook', data: [90, 110, 130, 120, 150, 140, 160, 170, 190, 180, 200, 210], color: '#1877f2' },
    { label: 'YouTube', data: [60, 80, 70, 90, 100, 95, 110, 120, 105, 130, 125, 140], color: '#ff0000' },
  ];
  const xLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const barData = [
    { label: 'Mon', values: [{ key: 'TikTok', value: 340, color: '#fe2c55' }, { key: 'Facebook', value: 180, color: '#1877f2' }, { key: 'YouTube', value: 120, color: '#ff0000' }] },
    { label: 'Tue', values: [{ key: 'TikTok', value: 420, color: '#fe2c55' }, { key: 'Facebook', value: 200, color: '#1877f2' }, { key: 'YouTube', value: 150, color: '#ff0000' }] },
    { label: 'Wed', values: [{ key: 'TikTok', value: 380, color: '#fe2c55' }, { key: 'Facebook', value: 190, color: '#1877f2' }, { key: 'YouTube', value: 130, color: '#ff0000' }] },
    { label: 'Thu', values: [{ key: 'TikTok', value: 510, color: '#fe2c55' }, { key: 'Facebook', value: 210, color: '#1877f2' }, { key: 'YouTube', value: 170, color: '#ff0000' }] },
    { label: 'Fri', values: [{ key: 'TikTok', value: 600, color: '#fe2c55' }, { key: 'Facebook', value: 250, color: '#1877f2' }, { key: 'YouTube', value: 190, color: '#ff0000' }] },
    { label: 'Sat', values: [{ key: 'TikTok', value: 720, color: '#fe2c55' }, { key: 'Facebook', value: 280, color: '#1877f2' }, { key: 'YouTube', value: 220, color: '#ff0000' }] },
    { label: 'Sun', values: [{ key: 'TikTok', value: 650, color: '#fe2c55' }, { key: 'Facebook', value: 260, color: '#1877f2' }, { key: 'YouTube', value: 200, color: '#ff0000' }] },
  ];

  const donutData = [
    { label: 'Positive', value: 620, color: '#10b981' },
    { label: 'Neutral', value: 280, color: '#f59e0b' },
    { label: 'Negative', value: 100, color: '#ef4444' },
  ];

  // Heatmap: 7 days x 8 time slots (static to avoid hydration mismatch)
  const heatmapData = [
    [0.2, 0.3, 0.5, 0.8, 0.9, 0.7, 0.4, 0.2],
    [0.1, 0.2, 0.4, 0.7, 0.95, 0.8, 0.5, 0.3],
    [0.15, 0.25, 0.6, 0.85, 0.9, 0.75, 0.45, 0.2],
    [0.1, 0.3, 0.5, 0.7, 0.85, 0.65, 0.4, 0.15],
    [0.2, 0.35, 0.55, 0.75, 0.92, 0.8, 0.55, 0.3],
    [0.4, 0.5, 0.6, 0.65, 0.7, 0.6, 0.55, 0.45],
    [0.35, 0.45, 0.55, 0.6, 0.65, 0.55, 0.5, 0.4],
  ];

  const tableColumns: Column<Record<string, unknown>>[] = [
    { key: 'rank', label: '#', width: '40px', sortable: true },
    { key: 'keyword', label: 'Keyword', sortable: true },
    { key: 'volume', label: 'Volume', sortable: true, render: (r) => Number(r.volume).toLocaleString() },
    { key: 'change', label: 'Change', sortable: true, render: (r) => <span style={{ color: 'var(--success)' }}>+{String(r.change)}%</span> },
  ];
  const tableData = [
    { rank: 1, keyword: '#chientranh', volume: 145300, change: 68.5 },
    { rank: 2, keyword: '#iran', volume: 89900, change: 52.3 },
    { rank: 3, keyword: '#tinnong24h', volume: 42800, change: 35.1 },
    { rank: 4, keyword: '#VinFast', volume: 28700, change: 42.1 },
    { rank: 5, keyword: '#AI', volume: 25600, change: 67.8 },
    { rank: 6, keyword: '#doituyenvietnam', volume: 89000, change: 156.2 },
    { rank: 7, keyword: '#gta6', volume: 67000, change: 320.5 },
    { rank: 8, keyword: '#iphone17', volume: 34500, change: 89.3 },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-24 pb-32">
      {/* ── Page Header ── */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
          Component Showcase
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          39 components — switch theme via the palette icon in TopNav to preview across all 4 themes.
        </p>

        {/* Quick nav */}
        <div className="flex flex-wrap gap-2 mt-4">
          {NAV_SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
         1. PRIMITIVES
         ═══════════════════════════════════════ */}
      <Section id="primitives" title="1. Primitives">
        <SubSection title="Badge">
          <ShowcaseBox>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="success">Active</Badge>
              <Badge variant="danger">Critical</Badge>
              <Badge variant="warning">Pending</Badge>
              <Badge variant="info">New</Badge>
              <Badge variant="neutral">Draft</Badge>
              <Badge variant="accent">Featured</Badge>
              <Badge variant="success" dot>Live</Badge>
              <Badge variant="danger" dot>Alert</Badge>
              <Badge variant="success" size="md">Active</Badge>
              <Badge variant="danger" size="md">Critical</Badge>
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="Tag">
          <ShowcaseBox>
            <div className="flex flex-wrap items-center gap-2">
              <Tag label="#VinFast" icon={<Hash />} />
              <Tag label="TikTok" color="#fe2c55" />
              <Tag label="Facebook" color="#1877f2" />
              <Tag label="YouTube" color="#ff0000" />
              <Tag label="Removable" removable onRemove={() => {}} />
              <Tag label="With Icon" icon={<Star />} color="#f59e0b" removable onRemove={() => {}} />
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="Skeleton">
          <ShowcaseBox>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </div>
              </div>
              <Skeleton variant="rect" height={60} />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton variant="card" height={80} />
                <Skeleton variant="card" height={80} />
                <Skeleton variant="card" height={80} />
              </div>
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="Tooltip">
          <ShowcaseBox>
            <div className="flex items-center gap-6">
              <Tooltip content="Top tooltip" side="top"><span className="text-[12px] underline decoration-dashed cursor-help" style={{ color: 'var(--text-secondary)' }}>Hover (top)</span></Tooltip>
              <Tooltip content="Bottom tooltip" side="bottom"><span className="text-[12px] underline decoration-dashed cursor-help" style={{ color: 'var(--text-secondary)' }}>Hover (bottom)</span></Tooltip>
              <Tooltip content="Left tooltip" side="left"><span className="text-[12px] underline decoration-dashed cursor-help" style={{ color: 'var(--text-secondary)' }}>Hover (left)</span></Tooltip>
              <Tooltip content="Right tooltip" side="right"><span className="text-[12px] underline decoration-dashed cursor-help" style={{ color: 'var(--text-secondary)' }}>Hover (right)</span></Tooltip>
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="IconButton">
          <ShowcaseBox>
            <div className="flex items-center gap-3">
              <IconButton icon={<Search />} label="Search" size="sm" />
              <IconButton icon={<Settings />} label="Settings" />
              <IconButton icon={<Bell />} label="Notifications" size="lg" />
              <Divider orientation="vertical" />
              <IconButton icon={<Download />} label="Download" variant="outline" />
              <IconButton icon={<Eye />} label="Preview" variant="solid" />
              <IconButton icon={<Trash2 />} label="Delete (disabled)" disabled />
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="Divider">
          <ShowcaseBox>
            <div className="space-y-0">
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Content above</p>
              <Divider />
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Default divider</p>
              <Divider label="Or" />
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Labeled divider</p>
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="EmptyState">
          <ShowcaseBox>
            <EmptyState
              title="No data yet"
              description="Connect a platform to start monitoring social mentions in real-time."
              action={
                <button
                  className="text-[12px] font-medium px-4 py-2 rounded-xl text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  Connect Platform
                </button>
              }
            />
          </ShowcaseBox>
        </SubSection>
      </Section>

      {/* ═══════════════════════════════════════
         2. FORMS & FILTERS
         ═══════════════════════════════════════ */}
      <Section id="forms" title="2. Forms & Filters">
        <SubSection title="SearchInput">
          <ShowcaseBox>
            <SearchInput placeholder="Search keywords, authors..." value={search} onChange={setSearch} className="max-w-sm" />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="Dropdown">
          <ShowcaseBox>
            <Dropdown
              options={[
                { value: 'mentions', label: 'Mentions', icon: <Activity /> },
                { value: 'engagement', label: 'Engagement', icon: <Heart /> },
                { value: 'sentiment', label: 'Sentiment', icon: <TrendingUp /> },
              ]}
              value={dropdown}
              onChange={setDropdown}
              placeholder="Select metric..."
              className="max-w-[220px]"
            />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="MultiSelect">
          <ShowcaseBox>
            <MultiSelect
              options={[
                { value: 'tiktok', label: 'TikTok' },
                { value: 'facebook', label: 'Facebook' },
                { value: 'youtube', label: 'YouTube' },
              ]}
              values={multiSel}
              onChange={setMultiSel}
              placeholder="Select platforms..."
              className="max-w-sm"
            />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="DateRangePicker">
          <ShowcaseBox>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="ToggleGroup">
          <ShowcaseBox>
            <div className="space-y-3">
              <ToggleGroup
                options={[
                  { value: 'mentions', label: 'Mentions', icon: <Activity /> },
                  { value: 'engagement', label: 'Engagement', icon: <Heart /> },
                  { value: 'sentiment', label: 'Sentiment', icon: <TrendingUp /> },
                ]}
                value={toggle}
                onChange={(v) => setToggle(v as string)}
              />
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="Checkbox & RadioGroup">
          <ShowcaseBox>
            <div className="flex items-start gap-12">
              <div className="space-y-2">
                <Checkbox checked={check1} onChange={setCheck1} label="Positive sentiment" />
                <Checkbox checked={check2} onChange={setCheck2} label="Negative sentiment" />
                <Checkbox checked={false} onChange={() => {}} label="Disabled" disabled />
                <Checkbox checked={true} onChange={() => {}} indeterminate label="Indeterminate" />
              </div>
              <div>
                <RadioGroup
                  options={[
                    { value: 'mentions', label: 'Mentions' },
                    { value: 'engagement', label: 'Engagement' },
                    { value: 'sentiment', label: 'Sentiment' },
                  ]}
                  value={radio}
                  onChange={setRadio}
                  direction="vertical"
                />
              </div>
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="FilterBar + ChipFilter">
          <ShowcaseBox>
            <FilterBar>
              <SearchInput placeholder="Search..." value={search} onChange={setSearch} className="w-48" />
              <Dropdown
                options={[
                  { value: 'all', label: 'All Platforms' },
                  { value: 'tiktok', label: 'TikTok' },
                  { value: 'facebook', label: 'Facebook' },
                ]}
                value=""
                onChange={() => {}}
                placeholder="Platform"
                className="w-40"
              />
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </FilterBar>
            <div className="mt-3">
              <ChipFilter
                activeFilters={chips}
                onRemove={(key) => setChips(c => c.filter(f => f.key !== key))}
                onClearAll={() => setChips([])}
              />
            </div>
          </ShowcaseBox>
        </SubSection>
      </Section>

      {/* ═══════════════════════════════════════
         3. DATA DISPLAY
         ═══════════════════════════════════════ */}
      <Section id="data" title="3. Data Display">
        <SubSection title="DataTable">
          <ShowcaseBox>
            <DataTable columns={tableColumns} data={tableData} pageSize={5} />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="RankList">
          <ShowcaseBox className="max-w-md">
            <RankList
              items={[
                { label: '#chientranh', value: 145300 },
                { label: '#doituyenvietnam', value: 89000 },
                { label: '#iran', value: 89900 },
                { label: '#gta6', value: 67000 },
                { label: '#iphone17', value: 34500 },
              ]}
            />
          </ShowcaseBox>
        </SubSection>
      </Section>

      {/* ═══════════════════════════════════════
         4. CARDS
         ═══════════════════════════════════════ */}
      <Section id="cards" title="4. Content Cards">
        <SubSection title="PostCard">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PostCard
              author="VTV24"
              content="BAN TIN CHIEN SU IRAN 05/03/2026: Khong quan My tan cong co so hat nhan, Iran tuyen bo tra dua"
              platform="YouTube"
              sentiment="negative"
              engagement={189000}
              time="45m ago"
            />
            <PostCard
              author="Bong Da 360"
              content="HIGHLIGHTS: Viet Nam 3-1 Thai Lan - Chien thang lich su tai AFF Cup 2026!"
              platform="TikTok"
              sentiment="positive"
              engagement={890000}
              time="52m ago"
            />
          </div>
        </SubSection>

        <SubSection title="PlatformOverviewCard">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PlatformOverviewCard name="TikTok" platform="tiktok" mentions={24580} mentionsChange={22.5} engagement="4.1M" sentiment={76} status="active" color="#fe2c55" />
            <PlatformOverviewCard name="Facebook" platform="facebook" mentions={8920} mentionsChange={7.2} engagement="1.8M" sentiment={70} status="active" color="#1877f2" />
            <PlatformOverviewCard name="YouTube" platform="youtube" mentions={4747} mentionsChange={3.8} engagement="1.4M" sentiment={68} status="active" color="#ff0000" />
          </div>
        </SubSection>

        <SubSection title="KeywordCard">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <KeywordCard rank={1} keyword="#chientranh" volume={145300} change={68.5} platforms={['tiktok', 'facebook', 'youtube']} />
            <KeywordCard rank={2} keyword="#iran" volume={89900} change={52.3} platforms={['tiktok', 'youtube']} />
            <KeywordCard rank={3} keyword="#VinFast" volume={28700} change={42.1} platforms={['tiktok', 'facebook', 'youtube']} />
            <KeywordCard rank={9} keyword="#doituyenvietnam" volume={89000} change={156.2} platforms={['tiktok', 'facebook', 'youtube']} />
          </div>
        </SubSection>

        <SubSection title="CampaignCard">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CampaignCard name="Q1 Brand Monitor" description="Brand health tracking campaign" mentions={38247} engagement={7300000} sentiment={73} childCount={12} />
            <CampaignCard name="Crisis: Iran Conflict" description="Real-time crisis monitoring" mentions={145300} engagement={4500000} sentiment={35} childCount={8} />
          </div>
        </SubSection>

        <SubSection title="ComparisonCard">
          <ShowcaseBox className="max-w-lg">
            <ComparisonCard
              items={[
                { label: 'TikTok', color: '#fe2c55', metrics: { mentions: 24580, engagement: 4100000, sentiment: 76 } },
                { label: 'Facebook', color: '#1877f2', metrics: { mentions: 8920, engagement: 1800000, sentiment: 70 } },
              ]}
              metricKeys={[
                { key: 'mentions', label: 'Mentions' },
                { key: 'engagement', label: 'Engagement' },
                { key: 'sentiment', label: 'Sentiment' },
              ]}
            />
          </ShowcaseBox>
        </SubSection>
      </Section>

      {/* ═══════════════════════════════════════
         5. CHARTS
         ═══════════════════════════════════════ */}
      <Section id="charts" title="5. Charts">
        <SubSection title="LineChart">
          <ShowcaseBox>
            <LineChart series={lineData} xLabels={xLabels} height={220} />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="BarChart">
          <ShowcaseBox>
            <BarChart categories={barData} height={220} />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="DonutChart">
          <ShowcaseBox>
            <DonutChart segments={donutData} />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="HeatmapGrid">
          <ShowcaseBox>
            <HeatmapGrid
              data={heatmapData}
              xLabels={['00', '03', '06', '09', '12', '15', '18', '21']}
              yLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
            />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="AreaChart">
          <ShowcaseBox>
            <AreaChart
              series={[
                { label: 'Mentions', data: [120, 180, 220, 310, 280, 350, 420, 390, 460, 520, 580, 610], color: '#8b5cf6' },
                { label: 'Engagement', data: [80, 120, 150, 200, 180, 230, 280, 260, 310, 350, 400, 430], color: '#0891b2' },
              ]}
              xLabels={xLabels}
              height={200}
            />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="GaugeChart">
          <ShowcaseBox>
            <div className="flex items-center justify-around flex-wrap gap-6">
              <GaugeChart value={73} label="Sentiment" />
              <GaugeChart value={45} label="Health" />
              <GaugeChart value={92} label="Reach" />
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="RadarChart">
          <ShowcaseBox>
            <div className="flex justify-center">
              <RadarChart
                axes={[
                  { key: 'mentions', label: 'Mentions' },
                  { key: 'engagement', label: 'Engagement' },
                  { key: 'sentiment', label: 'Sentiment' },
                  { key: 'reach', label: 'Reach' },
                  { key: 'growth', label: 'Growth' },
                ]}
                series={[
                  { label: 'TikTok', color: '#fe2c55', values: { mentions: 85, engagement: 92, sentiment: 76, reach: 88, growth: 95 } },
                  { label: 'Facebook', color: '#1877f2', values: { mentions: 60, engagement: 45, sentiment: 70, reach: 75, growth: 30 } },
                ]}
                size={280}
              />
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="FunnelChart">
          <ShowcaseBox>
            <div className="flex justify-center">
              <FunnelChart
                stages={[
                  { label: 'Total Mentions', value: 38247, color: '#8b5cf6' },
                  { label: 'Engaged', value: 18500, color: '#6366f1' },
                  { label: 'Clicked', value: 7200, color: '#4f46e5' },
                  { label: 'Converted', value: 2100, color: '#4338ca' },
                ]}
                height={280}
              />
            </div>
          </ShowcaseBox>
        </SubSection>
      </Section>

      {/* ═══════════════════════════════════════
         6. ANIMATED
         ═══════════════════════════════════════ */}
      <Section id="animated" title="6. Animated & Interactive">
        <SubSection title="PulseOrb">
          <ShowcaseBox>
            <div className="flex items-center justify-around py-4">
              <div className="flex flex-col items-center gap-2">
                <PulseOrb color="#10b981" size={56} label="OK" intensity={1} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Low</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PulseOrb color="#f59e0b" size={64} label="!" intensity={2} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Medium</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PulseOrb color="#ef4444" size={72} label="!!" intensity={3} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Crisis</span>
              </div>
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="FloatingBubbles">
          <ShowcaseBox className="p-0 overflow-hidden">
            <FloatingBubbles
              items={[
                { label: '#chientranh', value: 14530, color: '#ef4444' },
                { label: '#VinFast', value: 8700, color: '#10b981' },
                { label: '#iran', value: 8990, color: '#f59e0b' },
                { label: '#AI', value: 5600, color: '#8b5cf6' },
                { label: '#gta6', value: 6700, color: '#0891b2' },
                { label: '#iphone17', value: 3450, color: '#6366f1' },
                { label: '#esports', value: 2200, color: '#fe2c55' },
                { label: '#genz', value: 1800, color: '#1877f2' },
              ]}
              height={280}
            />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="GlowCard">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlowCard color="#fe2c55">
              <div className="p-5">
                <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>TikTok</p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>24.5K</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>mentions today</p>
              </div>
            </GlowCard>
            <GlowCard color="#1877f2">
              <div className="p-5">
                <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Facebook</p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>8.9K</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>mentions today</p>
              </div>
            </GlowCard>
            <GlowCard color="#ff0000">
              <div className="p-5">
                <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>YouTube</p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>4.7K</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>mentions today</p>
              </div>
            </GlowCard>
          </div>
        </SubSection>

        <SubSection title="WaveBackground">
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <WaveBackground color="#8b5cf6" height={180}>
              <div className="flex items-center justify-center h-[180px]">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>38,247</p>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Total Mentions Today</p>
                </div>
              </div>
            </WaveBackground>
          </div>
        </SubSection>

        <SubSection title="AnimatedCounter">
          <ShowcaseBox>
            <div className="flex items-center gap-10">
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Mentions</p>
                <AnimatedCounter value={38247} className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Engagement</p>
                <AnimatedCounter value={7300000} className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Sentiment</p>
                <AnimatedCounter value={73} suffix="%" className="text-2xl font-bold" format={(n) => n.toString()} style={{ color: 'var(--success)' }} />
              </div>
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="SentimentPulse">
          <ShowcaseBox>
            <div className="flex items-center justify-around">
              <SentimentPulse value={85} size={72} />
              <SentimentPulse value={52} size={72} />
              <SentimentPulse value={25} size={72} />
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="TrendArrow">
          <ShowcaseBox>
            <div className="flex items-center gap-4 flex-wrap">
              <TrendArrow value={22.5} size="sm" />
              <TrendArrow value={18.3} size="md" />
              <TrendArrow value={42.1} size="lg" />
              <TrendArrow value={0} size="md" />
              <TrendArrow value={-2.1} size="sm" />
              <TrendArrow value={-15.3} size="md" />
              <TrendArrow value={-8.7} size="lg" />
            </div>
          </ShowcaseBox>
        </SubSection>
      </Section>

      {/* ═══════════════════════════════════════
         7. NAVIGATION
         ═══════════════════════════════════════ */}
      <Section id="navigation" title="7. Navigation & Layout">
        <SubSection title="TabBar">
          <ShowcaseBox>
            <TabBar
              tabs={[
                { value: 'posts', label: 'Posts', icon: <LayoutDashboard />, count: 142 },
                { value: 'keywords', label: 'Keywords', icon: <Hash />, count: 28 },
                { value: 'insights', label: 'Insights', icon: <Lightbulb /> },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="Breadcrumb">
          <ShowcaseBox>
            <Breadcrumb items={[
              { label: 'Campaigns', onClick: () => {} },
              { label: 'Q1 Brand Monitor', onClick: () => {} },
              { label: '#VinFast' },
            ]} />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="CollapsiblePanel">
          <div className="space-y-3">
            <CollapsiblePanel title="Filter Options" defaultOpen>
              <div className="space-y-2">
                <Checkbox checked={check1} onChange={setCheck1} label="Include positive" />
                <Checkbox checked={check2} onChange={setCheck2} label="Include negative" />
              </div>
            </CollapsiblePanel>
            <CollapsiblePanel title="Advanced Settings" defaultOpen={false}>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Advanced settings go here...</p>
            </CollapsiblePanel>
          </div>
        </SubSection>
      </Section>

      {/* ═══════════════════════════════════════
         7. FEEDBACK & OVERLAY
         ═══════════════════════════════════════ */}
      <Section id="feedback" title="8. Feedback & Overlay">
        <SubSection title="ProgressBar">
          <ShowcaseBox>
            <div className="space-y-4 max-w-md">
              <ProgressBar value={25} size="sm" />
              <ProgressBar value={65} showLabel />
              <ProgressBar value={90} size="lg" color="var(--success)" showLabel />
              <ProgressBar value={40} color="var(--warning)" showLabel />
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="AlertBanner">
          <div className="space-y-3">
            <AlertBanner type="info" title="Data sync in progress" message="Your platforms are being synced. This may take a few minutes." dismissable />
            <AlertBanner type="warning" title="Sentiment drop detected" message="Sentiment for #chientranh dropped 15% in the last 2 hours." dismissable />
            <AlertBanner type="danger" title="Crisis Alert" message="Engagement spike detected with negative sentiment. Immediate attention recommended." />
          </div>
        </SubSection>

        <SubSection title="Modal & ConfirmDialog">
          <ShowcaseBox>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setModalOpen(true)}
                className="text-[12px] font-medium px-4 py-2 rounded-xl text-white"
                style={{ background: 'var(--accent)' }}
              >
                Open Modal
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                className="text-[12px] font-medium px-4 py-2 rounded-xl text-white"
                style={{ background: 'var(--danger)' }}
              >
                Open Confirm
              </button>
            </div>
          </ShowcaseBox>
        </SubSection>

        <SubSection title="Toast">
          <ShowcaseBox>
            <div className="flex items-center gap-2">
              <button onClick={() => pushToast('Data refreshed successfully', 'success')} className="text-[12px] font-medium px-3 py-2 rounded-xl" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>Success</button>
              <button onClick={() => pushToast('Something went wrong', 'error')} className="text-[12px] font-medium px-3 py-2 rounded-xl" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>Error</button>
              <button onClick={() => pushToast('New mentions detected', 'info')} className="text-[12px] font-medium px-3 py-2 rounded-xl" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>Info</button>
              <button onClick={() => pushToast('Sentiment dropping rapidly', 'warning')} className="text-[12px] font-medium px-3 py-2 rounded-xl" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>Warning</button>
            </div>
          </ShowcaseBox>
        </SubSection>
      </Section>

      {/* ═══════════════════════════════════════
         8. REALTIME
         ═══════════════════════════════════════ */}
      <Section id="realtime" title="9. Realtime & Interactive">
        <SubSection title="TimeSlider">
          <ShowcaseBox className="max-w-lg">
            <TimeSlider
              min={0}
              max={24}
              value={sliderVal}
              onChange={setSliderVal}
              marks={[
                { value: 0, label: '00:00' },
                { value: 6, label: '06:00' },
                { value: 12, label: '12:00' },
                { value: 18, label: '18:00' },
                { value: 24, label: '24:00' },
              ]}
            />
          </ShowcaseBox>
        </SubSection>

        <SubSection title="CountdownTimer">
          <ShowcaseBox>
            <div className="flex items-center gap-6">
              <CountdownTimer seconds={120} />
              <CountdownTimer seconds={30} />
            </div>
          </ShowcaseBox>
        </SubSection>
      </Section>

      {/* ── Modals (portaled) ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Post Detail">
        <div className="space-y-3">
          <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            This is a sample modal dialog. It can contain any content — post details, charts, forms, etc.
          </p>
          <div className="flex gap-3">
            <Badge variant="success" dot>Live</Badge>
            <Badge variant="info">TikTok</Badge>
            <Badge variant="warning">Trending</Badge>
          </div>
          <ProgressBar value={72} showLabel />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => { setConfirmOpen(false); pushToast('Campaign deleted', 'error'); }}
        onCancel={() => setConfirmOpen(false)}
      />

      <ToastContainer />
    </div>
  );
}
