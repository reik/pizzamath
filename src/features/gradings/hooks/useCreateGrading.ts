import { useMutation } from '@tanstack/react-query'
import { gradingsApi, type Grading } from '@/api/gradings'

export function useCreateGrading() {
  return useMutation<Grading, Error, string>({
    mutationFn: (uploadId: string) => gradingsApi.create(uploadId),
  })
}
