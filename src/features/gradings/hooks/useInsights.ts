import { useQuery } from '@tanstack/react-query'
import { gradingsApi, gradingsQueryKeys } from '@/api/gradings'

export function useInsights() {
  return useQuery({ queryKey: gradingsQueryKeys.insights, queryFn: gradingsApi.insights })
}
