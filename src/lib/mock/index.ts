/**
 * Mock mode switch. Enable via NEXT_PUBLIC_MOCK_API=1 in .env.local.
 * When on, all analytics + project-srv proxy GETs return fixtures;
 * mutations are no-ops that return 200 without hitting the backend.
 */
export const IS_MOCK =
  process.env.NEXT_PUBLIC_MOCK_API === '1' ||
  process.env.NEXT_PUBLIC_MOCK_API === 'true';

export * from './fixtures';
