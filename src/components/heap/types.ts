export type EntityType = 'campaign' | 'project' | 'keyword' | 'post' | 'comment';

export type PlatformType = 'tiktok' | 'facebook' | 'youtube';

export interface HeapNode {
  id: string;
  type: EntityType;
  name: string;
  description?: string;
  platform?: PlatformType;
  author?: string;
  content?: string;
  metrics: {
    mentions?: number;
    engagement?: number;
    sentiment?: number;
    childCount?: number;
  };
  children?: HeapNode[];
}

export interface PhysicsState {
  baseX: number;
  baseY: number;
  oscFreqX: number;
  oscFreqY: number;
  oscAmpX: number;
  oscAmpY: number;
  phaseX: number;
  phaseY: number;
}

export interface SatelliteData extends HeapNode {
  parentId: string;
  satIndex: number;
  satTotal: number;
}
