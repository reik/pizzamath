import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userUploadsApi, type CreateUploadInput } from '@/api/userUploads'
import { queryKeys } from '@/api/queryKeys'

export function useAllUploadsForAdmin() {
  return useQuery({
    queryKey: queryKeys.userUploads.allForAdmin(),
    queryFn: () => userUploadsApi.getAllForAdmin(),
  })
}

export function useUserUploads(userId: string) {
  return useQuery({
    queryKey: queryKeys.userUploads.all(userId),
    queryFn: () => userUploadsApi.getAll(userId),
    enabled: !!userId,
  })
}

export function useUserUpload(id: string) {
  return useQuery({
    queryKey: queryKeys.userUploads.detail(id),
    queryFn: () => userUploadsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateUpload(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUploadInput) => userUploadsApi.create(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userUploads.all(userId) })
    },
  })
}

export function useUpdateUpload(id: string, userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { content?: string; answerContent?: string }) =>
      userUploadsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userUploads.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.userUploads.all(userId) })
    },
  })
}

export function useDeleteUpload(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => userUploadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userUploads.all(userId) })
    },
  })
}
