import type { WorksheetFilters } from '@/types/worksheet'

export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  categories: {
    all: () => ['categories'] as const,
  },
  worksheets: {
    all: () => ['worksheets'] as const,
    filtered: (filters: WorksheetFilters) => ['worksheets', filters] as const,
    detail: (id: string) => ['worksheets', id] as const,
  },
  progress: {
    all: (userId: string) => ['progress', userId] as const,
  },
  userUploads: {
    allForAdmin: () => ['userUploads', 'all'] as const,
    all: (userId: string) => ['userUploads', userId] as const,
    detail: (id: string) => ['userUploads', id] as const,
  },
} as const
