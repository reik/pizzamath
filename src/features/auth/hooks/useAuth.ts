import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi, type LoginInput, type RegisterInput } from '@/api/auth'
import { queryKeys } from '@/api/queryKeys'
import { useAuthStore } from '../store'

export function useAuth() {
  const { user, token, setUser, clearUser } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const me = await authApi.me()
      setUser(me, token!)
      return me
    },
    enabled: !!token && !user,
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: (data) => {
      setUser(data.user, data.token)
      navigate('/')
    },
  })

  const registerMutation = useMutation({
    mutationFn: (data: RegisterInput) => authApi.register(data),
    onSuccess: (data) => {
      setUser(data.user, data.token)
      navigate('/')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearUser()
      queryClient.clear()
      navigate('/login')
    },
  })

  return { user, loginMutation, registerMutation, logoutMutation }
}
