import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { worksheetsApi } from '@/api/worksheets'
import { queryKeys } from '@/api/queryKeys'

export function useAdminWorksheets() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.worksheets.all(),
    queryFn: () => worksheetsApi.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => worksheetsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.worksheets.all() }),
  })

  const createMutation = useMutation({
    mutationFn: worksheetsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.worksheets.all() }),
  })

  return { query, deleteMutation, createMutation }
}
