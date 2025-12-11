/**
 * Sample data for project preview
 * Based on: docs/DRY-RUN-DATA-FLOW.md (lines 502-573)
 *
 * This data is shown to users before they trigger the actual preview
 * to demonstrate what kind of data will be displayed.
 */

import { DryRunOuterPayload } from '@/lib/types/dryrun'

export const SAMPLE_PREVIEW_DATA: DryRunOuterPayload = {
  type: 'dryrun_result',
  job_id: 'sample-preview-job-id',
  platform: 'tiktok',
  status: 'success',
  payload: {
    content: [
      {
        meta: {
          id: '7234567890123456789',
          platform: 'tiktok',
          job_id: '550e8400-e29b-41d4-a716-446655440000',
          crawled_at: '2024-01-15T10:30:00Z',
          published_at: '2024-01-10T08:00:00Z',
          permalink: 'https://www.tiktok.com/@user/video/7234567890123456789',
          keyword_source: 'cooking tutorial',
          lang: 'vi',
          region: 'VN',
          pipeline_version: 'crawler_tiktok_v3',
          fetch_status: 'success',
          fetch_error: null
        },
        content: {
          text: 'Easy cooking tutorial! #cooking #food',
          duration: 45,
          hashtags: ['cooking', 'food'],
          sound_name: 'Original Sound - User',
          category: 'Food',
          media: {
            type: 'audio',
            video_path: '',
            audio_path: 'tiktok/job-abc-123/7234567890123456789.mp3',
            downloaded_at: '2024-01-15T10:31:00Z'
          },
          transcription: 'Today I will show you how to cook...'
        },
        interaction: {
          views: 150000,
          likes: 12000,
          comments_count: 450,
          shares: 890,
          saves: 2300,
          engagement_rate: 0.0893,
          updated_at: '2024-01-15T10:30:00Z'
        },
        author: {
          id: 'user123',
          name: 'Cooking Master',
          username: 'cookingmaster',
          followers: 500000,
          following: 123,
          likes: 5000000,
          videos: 234,
          is_verified: true,
          bio: 'Professional chef sharing recipes',
          avatar_url: null,
          profile_url: 'https://www.tiktok.com/@cookingmaster'
        },
        comments: [
          {
            id: 'comment123',
            parent_id: null,
            post_id: '7234567890123456789',
            user: {
              id: null,
              name: 'FoodLover',
              avatar_url: null
            },
            text: 'Amazing recipe!',
            likes: 45,
            replies_count: 2,
            published_at: '2024-01-10T09:00:00Z',
            is_author: false,
            media: null
          }
        ]
      }
    ],
    errors: []
  }
}
