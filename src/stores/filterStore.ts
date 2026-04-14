import { create } from 'zustand'

interface FilterStore {
  selectedCategoryId: string | null
  selectedSubcategoryId: string | null
  keyword: string
  setCategory: (id: string | null) => void
  setSubcategory: (id: string | null) => void
  setKeyword: (kw: string) => void
}

export const useFilterStore = create<FilterStore>()((set) => ({
  selectedCategoryId: null,
  selectedSubcategoryId: null,
  keyword: '',
  setCategory: (id) => set({ selectedCategoryId: id, selectedSubcategoryId: null }),
  setSubcategory: (id) => set({ selectedSubcategoryId: id }),
  setKeyword: (kw) => set({ keyword: kw }),
}))
