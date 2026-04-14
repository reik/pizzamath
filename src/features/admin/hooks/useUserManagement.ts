import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, type AddUserInput } from '@/api/users'

const USERS_KEY = ['admin', 'users'] as const

export function useUserManagement() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: USERS_KEY })

  const query = useQuery({
    queryKey: USERS_KEY,
    queryFn: usersApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: (data: AddUserInput) => usersApi.create(data),
    onSuccess: invalidate,
  })

  const suspendMutation = useMutation({
    mutationFn: (id: string) => usersApi.suspend(id),
    onSuccess: invalidate,
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: invalidate,
  })

  return { query, createMutation, suspendMutation, activateMutation, deleteMutation }
}
