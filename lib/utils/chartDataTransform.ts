import { UnifiedChartData, CriticalEvent, SentimentBreakdown } from '../../components/dashboard/charts/UnifiedChart'

// Type definitions for the original separate data sources
export interface TrendData {
  date: string
  mentions: number
  sentiment: number
}

export interface CrisisDataPoint {
  id: string
  timestamp: number
  date: string
  impact_score: number
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  platform: string
  mentions: number
}

export interface SentimentData {
  name: string
  value: number
  color: string
}

/**
 * Transforms separate data sources into unified chart data structure
 * @param trendData - Array of trend data points with mentions and sentiment
 * @param crisisData - Array of crisis/critical event data points
 * @param sentimentData - Array of sentiment distribution data
 * @returns Array of unified chart data points
 */
export function transformToUnifiedData(
  trendData: TrendData[],
  crisisData: CrisisDataPoint[],
  sentimentData: SentimentData[]
): UnifiedChartData[] {
  // Create a map of dates to crisis events for efficient lookup
  const crisisEventsByDate = new Map<string, CriticalEvent[]>()
  
  crisisData.forEach(crisis => {
    const dateKey = crisis.date.split(' ')[0] // Extract date part from datetime string
    if (!crisisEventsByDate.has(dateKey)) {
      crisisEventsByDate.set(dateKey, [])
    }
    
    crisisEventsByDate.get(dateKey)!.push({
      id: crisis.id,
      timestamp: crisis.timestamp,
      impact_score: crisis.impact_score,
      risk: crisis.risk,
      title: crisis.title,
      platform: crisis.platform
    })
  })

  // Convert sentiment array to breakdown object
  const sentimentBreakdown: SentimentBreakdown = {
    positive: sentimentData.find(s => s.name === 'Positive')?.value || 0,
    negative: sentimentData.find(s => s.name === 'Negative')?.value || 0,
    neutral: sentimentData.find(s => s.name === 'Neutral')?.value || 0
  }

  // Transform trend data into unified format
  return trendData.map(trend => ({
    date: trend.date,
    mentions: trend.mentions,
    sentiment: sentimentBreakdown, // Use same sentiment breakdown for all dates (as per sample data requirement)
    criticalEvents: crisisEventsByDate.get(trend.date) || []
  }))
}

/**
 * Validates that the unified chart data structure is correct
 * @param data - Array of unified chart data to validate
 * @returns boolean indicating if data is valid
 */
export function validateUnifiedChartData(data: UnifiedChartData[]): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    return false
  }

  return data.every(dataPoint => {
    // Check required fields
    if (!dataPoint.date || typeof dataPoint.mentions !== 'number') {
      return false
    }

    // Check sentiment breakdown
    if (!dataPoint.sentiment || 
        typeof dataPoint.sentiment.positive !== 'number' ||
        typeof dataPoint.sentiment.negative !== 'number' ||
        typeof dataPoint.sentiment.neutral !== 'number') {
      return false
    }

    // Check that sentiment percentages sum to 100 (with small tolerance for floating point)
    const sentimentSum = dataPoint.sentiment.positive + dataPoint.sentiment.negative + dataPoint.sentiment.neutral
    if (Math.abs(sentimentSum - 100) > 0.1) {
      return false
    }

    // Check critical events structure if present
    if (dataPoint.criticalEvents) {
      return dataPoint.criticalEvents.every(event => 
        event.id && 
        typeof event.timestamp === 'number' &&
        typeof event.impact_score === 'number' &&
        ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(event.risk) &&
        event.title &&
        event.platform
      )
    }

    return true
  })
}

/**
 * Creates sample unified chart data for development and testing
 * Generates 14 days of data to support testing of all time range options (7d, 14d, 30d, etc.)
 * Dates are relative to current date for realistic testing
 * @returns Array of sample unified chart data (14 days)
 */
export function createSampleUnifiedData(): UnifiedChartData[] {
  const now = new Date()
  const formatDate = (daysAgo: number) => {
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString().split('T')[0]
  }

  const sampleData: UnifiedChartData[] = [
    // Day 14 (oldest)
    {
      date: formatDate(13),
      mentions: 950,
      sentiment: { positive: 40, negative: 22, neutral: 38 },
      criticalEvents: [
        {
          id: 'c1',
          timestamp: new Date(formatDate(13) + 'T09:00:00').getTime(),
          impact_score: 42,
          risk: 'MEDIUM',
          title: 'Service quality discussion',
          platform: 'Facebook'
        }
      ]
    },
    // Day 13
    {
      date: formatDate(12),
      mentions: 1050,
      sentiment: { positive: 43, negative: 20, neutral: 37 },
      criticalEvents: []
    },
    // Day 12
    {
      date: formatDate(11),
      mentions: 1200,
      sentiment: { positive: 45, negative: 20, neutral: 35 },
      criticalEvents: [
        {
          id: 'c2',
          timestamp: new Date(formatDate(11) + 'T10:30:00').getTime(),
          impact_score: 85,
          risk: 'CRITICAL',
          title: 'Negative review went viral',
          platform: 'Facebook'
        }
      ]
    },
    // Day 11
    {
      date: formatDate(10),
      mentions: 1350,
      sentiment: { positive: 48, negative: 18, neutral: 34 },
      criticalEvents: [
        {
          id: 'c3',
          timestamp: new Date(formatDate(10) + 'T14:20:00').getTime(),
          impact_score: 72,
          risk: 'HIGH',
          title: 'Product complaint trending',
          platform: 'TikTok'
        }
      ]
    },
    // Day 10
    {
      date: formatDate(9),
      mentions: 1100,
      sentiment: { positive: 42, negative: 25, neutral: 33 },
      criticalEvents: [
        {
          id: 'c4',
          timestamp: new Date(formatDate(9) + 'T09:15:00').getTime(),
          impact_score: 45,
          risk: 'MEDIUM',
          title: 'Service delay discussion',
          platform: 'Facebook'
        },
        {
          id: 'c5',
          timestamp: new Date(formatDate(9) + 'T16:45:00').getTime(),
          impact_score: 91,
          risk: 'CRITICAL',
          title: 'PR crisis escalating',
          platform: 'YouTube'
        }
      ]
    },
    // Day 9
    {
      date: formatDate(8),
      mentions: 1600,
      sentiment: { positive: 52, negative: 15, neutral: 33 },
      criticalEvents: [
        {
          id: 'c6',
          timestamp: new Date(formatDate(8) + 'T11:00:00').getTime(),
          impact_score: 58,
          risk: 'HIGH',
          title: 'Customer complaint spike',
          platform: 'Instagram'
        }
      ]
    },
    // Day 8 (start of most recent 7 days when testing 7d vs 14d)
    {
      date: formatDate(7),
      mentions: 1800,
      sentiment: { positive: 55, negative: 12, neutral: 33 },
      criticalEvents: [
        {
          id: 'c7',
          timestamp: new Date(formatDate(7) + 'T08:30:00').getTime(),
          impact_score: 32,
          risk: 'LOW',
          title: 'Minor feedback issue',
          platform: 'Facebook'
        }
      ]
    },
    // Day 7
    {
      date: formatDate(6),
      mentions: 1500,
      sentiment: { positive: 50, negative: 18, neutral: 32 },
      criticalEvents: [
        {
          id: 'c8',
          timestamp: new Date(formatDate(6) + 'T13:20:00').getTime(),
          impact_score: 65,
          risk: 'HIGH',
          title: 'Competitor attack post',
          platform: 'TikTok'
        }
      ]
    },
    // Day 6
    {
      date: formatDate(5),
      mentions: 2000,
      sentiment: { positive: 58, negative: 10, neutral: 32 },
      criticalEvents: [
        {
          id: 'c9',
          timestamp: new Date(formatDate(5) + 'T10:10:00').getTime(),
          impact_score: 28,
          risk: 'LOW',
          title: 'General inquiry thread',
          platform: 'YouTube'
        }
      ]
    },
    // Day 5
    {
      date: formatDate(4),
      mentions: 1750,
      sentiment: { positive: 56, negative: 14, neutral: 30 },
      criticalEvents: []
    },
    // Day 4
    {
      date: formatDate(3),
      mentions: 1900,
      sentiment: { positive: 60, negative: 12, neutral: 28 },
      criticalEvents: [
        {
          id: 'c10',
          timestamp: new Date(formatDate(3) + 'T15:30:00').getTime(),
          impact_score: 38,
          risk: 'MEDIUM',
          title: 'Feature request discussion',
          platform: 'Instagram'
        }
      ]
    },
    // Day 3
    {
      date: formatDate(2),
      mentions: 2100,
      sentiment: { positive: 62, negative: 10, neutral: 28 },
      criticalEvents: [
        {
          id: 'c11',
          timestamp: new Date(formatDate(2) + 'T11:45:00').getTime(),
          impact_score: 25,
          risk: 'LOW',
          title: 'Positive campaign feedback',
          platform: 'Facebook'
        }
      ]
    },
    // Day 2
    {
      date: formatDate(1),
      mentions: 2250,
      sentiment: { positive: 65, negative: 8, neutral: 27 },
      criticalEvents: [
        {
          id: 'c12',
          timestamp: new Date(formatDate(1) + 'T09:20:00').getTime(),
          impact_score: 68,
          risk: 'HIGH',
          title: 'Viral positive testimonial',
          platform: 'TikTok'
        }
      ]
    },
    // Day 1 (today/most recent)
    {
      date: formatDate(0),
      mentions: 2400,
      sentiment: { positive: 68, negative: 7, neutral: 25 },
      criticalEvents: [
        {
          id: 'c13',
          timestamp: new Date(formatDate(0) + 'T14:00:00').getTime(),
          impact_score: 52,
          risk: 'MEDIUM',
          title: 'New product launch buzz',
          platform: 'YouTube'
        }
      ]
    }
  ]

  return sampleData
}