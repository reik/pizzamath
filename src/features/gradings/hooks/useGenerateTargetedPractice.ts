import { useMutation } from '@tanstack/react-query'
import { gradingsApi, type GeneratedWorksheet } from '@/api/gradings'

export function useGenerateTargetedPractice() {
  return useMutation<GeneratedWorksheet, Error, string>({
    mutationFn: (gradingId: string) => gradingsApi.generatePractice(gradingId),
  })
}
