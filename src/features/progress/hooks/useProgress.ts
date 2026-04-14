import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { progressApi } from '@/api/progress'
import { queryKeys } from '@/api/queryKeys'
import type { ProgressEntry } from '@/types/progress'

export function useProgress(userId: string) {
  return useQuery({
    queryKey: queryKeys.progress.all(userId),
    queryFn: () => progressApi.getAll(userId),
    enabled: !!userId,
  })
}

export function useProgressMutation(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entry: Omit<ProgressEntry, 'id'>) => progressApi.create(entry),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.progress.all(userId) }),
  })
}
