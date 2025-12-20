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
 * @returns Array of sample unified chart data
 */
export function createSampleUnifiedData(): UnifiedChartData[] {
  const sampleData: UnifiedChartData[] = [
    {
      date: '2025-12-01',
      mentions: 1200,
      sentiment: { positive: 45, negative: 20, neutral: 35 },
      criticalEvents: [
        {
          id: 'c1',
          timestamp: new Date('2025-12-01T10:30:00').getTime(),
          impact_score: 85,
          risk: 'CRITICAL',
          title: 'Negative review went viral',
          platform: 'Facebook'
        }
      ]
    },
    {
      date: '2025-12-02',
      mentions: 1350,
      sentiment: { positive: 48, negative: 18, neutral: 34 },
      criticalEvents: [
        {
          id: 'c2',
          timestamp: new Date('2025-12-02T14:20:00').getTime(),
          impact_score: 72,
          risk: 'HIGH',
          title: 'Product complaint trending',
          platform: 'TikTok'
        }
      ]
    },
    {
      date: '2025-12-03',
      mentions: 1100,
      sentiment: { positive: 42, negative: 25, neutral: 33 },
      criticalEvents: [
        {
          id: 'c3',
          timestamp: new Date('2025-12-03T09:15:00').getTime(),
          impact_score: 45,
          risk: 'MEDIUM',
          title: 'Service delay discussion',
          platform: 'Facebook'
        },
        {
          id: 'c4',
          timestamp: new Date('2025-12-03T16:45:00').getTime(),
          impact_score: 91,
          risk: 'CRITICAL',
          title: 'PR crisis escalating',
          platform: 'YouTube'
        }
      ]
    },
    {
      date: '2025-12-04',
      mentions: 1600,
      sentiment: { positive: 52, negative: 15, neutral: 33 },
      criticalEvents: [
        {
          id: 'c5',
          timestamp: new Date('2025-12-04T11:00:00').getTime(),
          impact_score: 58,
          risk: 'HIGH',
          title: 'Customer complaint spike',
          platform: 'Instagram'
        }
      ]
    },
    {
      date: '2025-12-05',
      mentions: 1800,
      sentiment: { positive: 55, negative: 12, neutral: 33 },
      criticalEvents: [
        {
          id: 'c6',
          timestamp: new Date('2025-12-05T08:30:00').getTime(),
          impact_score: 32,
          risk: 'LOW',
          title: 'Minor feedback issue',
          platform: 'Facebook'
        }
      ]
    },
    {
      date: '2025-12-06',
      mentions: 1500,
      sentiment: { positive: 50, negative: 18, neutral: 32 },
      criticalEvents: [
        {
          id: 'c7',
          timestamp: new Date('2025-12-06T13:20:00').getTime(),
          impact_score: 65,
          risk: 'HIGH',
          title: 'Competitor attack post',
          platform: 'TikTok'
        }
      ]
    },
    {
      date: '2025-12-07',
      mentions: 2000,
      sentiment: { positive: 58, negative: 10, neutral: 32 },
      criticalEvents: [
        {
          id: 'c8',
          timestamp: new Date('2025-12-07T10:10:00').getTime(),
          impact_score: 28,
          risk: 'LOW',
          title: 'General inquiry thread',
          platform: 'YouTube'
        }
      ]
    }
  ]

  return sampleData
}