import type { CrisisConfigInput } from '@/lib/api/projects';

export function buildDefaultCrisisConfig(): CrisisConfigInput {
  return {
    status: 'NORMAL',
    keywords_trigger: {
      enabled: true,
      logic: 'OR',
      groups: [
        {
          name: 'Service risk',
          keywords: ['complaint', 'issue', 'bad experience', 'delay', 'broken', 'refund'],
          weight: 6,
        },
      ],
    },
    volume_trigger: {
      enabled: true,
      metric: 'MENTIONS',
      rules: [
        {
          level: 'WARNING',
          threshold_percent_growth: 150,
          comparison_window_hours: 6,
          baseline: 'AVERAGE_7D',
        },
        {
          level: 'CRITICAL',
          threshold_percent_growth: 300,
          comparison_window_hours: 2,
          baseline: 'AVERAGE_7D',
        },
      ],
    },
    sentiment_trigger: {
      enabled: true,
      min_sample_size: 10,
      rules: [
        {
          type: 'NEGATIVE_SPIKE',
          threshold_percent: 35,
        },
      ],
    },
    influencer_trigger: {
      enabled: true,
      logic: 'OR',
      rules: [
        {
          type: 'HIGH_REACH',
          min_followers: 50000,
          required_sentiment: 'NEGATIVE',
        },
        {
          type: 'VIRAL_NEGATIVE',
          min_shares: 300,
          min_comments: 150,
        },
      ],
    },
    response_policy: buildDefaultResponsePolicy(),
  };
}

function buildAhamoveLogisticsCrisisConfig(): CrisisConfigInput {
  return {
    status: 'NORMAL',
    keywords_trigger: {
      enabled: true,
      logic: 'OR',
      groups: [
        {
          name: 'Service failure',
          keywords: [
            'giao cham',
            'tre don',
            'khong co tai xe',
            'huy don',
            'that lac',
            'mat hang',
            'vo hang',
            'giao sai',
            'khong giao duoc',
          ],
          weight: 10,
        },
        {
          name: 'Payment and COD',
          keywords: [
            'cod loi',
            'thu ho sai',
            'thu them tien',
            'tinh sai tien',
            'khong hoan tien',
            'nap tien loi',
            'rut tien loi',
          ],
          weight: 8,
        },
        {
          name: 'Trust and safety',
          keywords: [
            'lua dao',
            'scam',
            'gia mao',
            'tai xe vo y thuc',
            'khong an toan',
            'tai nan',
            'khieu nai',
          ],
          weight: 9,
        },
      ],
    },
    volume_trigger: {
      enabled: true,
      metric: 'MENTIONS',
      rules: [
        {
          level: 'WARNING',
          threshold_percent_growth: 180,
          comparison_window_hours: 6,
          baseline: 'AVERAGE_7D',
        },
        {
          level: 'CRITICAL',
          threshold_percent_growth: 350,
          comparison_window_hours: 2,
          baseline: 'AVERAGE_7D',
        },
      ],
    },
    sentiment_trigger: {
      enabled: true,
      min_sample_size: 12,
      rules: [
        {
          type: 'NEGATIVE_SPIKE',
          threshold_percent: 30,
        },
        {
          type: 'ASPECT_NEGATIVE',
          critical_aspects: [
            'delivery_speed',
            'delivery_fee',
            'driver_quality',
            'package_safety',
            'payment',
            'support_resolution',
            'trust_safety',
            'coverage',
          ],
          negative_threshold_percent: 55,
        },
      ],
    },
    influencer_trigger: {
      enabled: true,
      logic: 'OR',
      rules: [
        {
          type: 'HIGH_REACH',
          min_followers: 50000,
          required_sentiment: 'NEGATIVE',
        },
        {
          type: 'VIRAL_NEGATIVE',
          min_shares: 300,
          min_comments: 150,
        },
      ],
    },
    response_policy: buildDefaultResponsePolicy(),
  };
}

export function buildDefaultResponsePolicy(): NonNullable<CrisisConfigInput['response_policy']> {
  return {
    adaptive_crawl: {
      enabled: true,
      trigger_level: 'WATCH',
      cooldown_minutes: 30,
    },
    notification: {
      enabled: true,
      trigger_level: 'WARNING',
      repeat_cooldown_minutes: 60,
      ops_alert_on_critical: true,
    },
  };
}

export function buildCrisisConfigPreset(domainTypeCode?: string): CrisisConfigInput | null {
  switch ((domainTypeCode ?? '').trim().toLowerCase()) {
    case 'ahamove':
      return buildAhamoveLogisticsCrisisConfig();
    default:
      return null;
  }
}
