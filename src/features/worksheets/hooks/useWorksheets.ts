import { useQuery } from '@tanstack/react-query'
import { worksheetsApi, categoriesApi } from '@/api/worksheets'
import { queryKeys } from '@/api/queryKeys'
import { useFilterStore } from '@/stores/filterStore'

export function useWorksheets() {
  const { selectedCategoryId, selectedSubcategoryId, keyword } = useFilterStore()
  const filters = {
    categoryId: selectedCategoryId ?? undefined,
    subcategoryId: selectedSubcategoryId ?? undefined,
    keyword: keyword || undefined,
  }
  return useQuery({
    queryKey: queryKeys.worksheets.filtered(filters),
    queryFn: () => worksheetsApi.getAll(filters),
  })
}

export function useWorksheet(id: string) {
  return useQuery({
    queryKey: queryKeys.worksheets.detail(id),
    queryFn: () => worksheetsApi.getById(id),
    enabled: !!id,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => categoriesApi.getAll(),
  })
}
