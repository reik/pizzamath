import { useQuery } from '@tanstack/react-query'
import { gradingsApi } from '@/api/gradings'
import { queryKeys } from '@/api/queryKeys'

export function useGrading(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.gradings.one(id) : ['gradings', 'none'],
    queryFn: () => gradingsApi.get(id!),
    enabled: !!id,
  })
}
