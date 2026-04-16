import { waitFor } from '@testing-library/react'
import { useWorksheets, useWorksheet, useCategories } from './useWorksheets'
import { renderHookWithProviders } from '@/test/renderWithProviders'
import { useFilterStore } from '@/stores/filterStore'

afterEach(() => {
  useFilterStore.setState({ selectedCategoryId: null, selectedSubcategoryId: null, keyword: '' })
})

describe('useWorksheets', () => {
  it('should_return_all_seeded_worksheets_when_no_filter_applied', async () => {
    // Arrange + Act
    const { result } = renderHookWithProviders(() => useWorksheets())

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(3)
  })

  it('should_filter_worksheets_by_category_id', async () => {
    // Arrange — set filter to cat-1 (Counting & Cardinality)
    useFilterStore.setState({ selectedCategoryId: 'cat-1', selectedSubcategoryId: null, keyword: '' })

    // Act
    const { result } = renderHookWithProviders(() => useWorksheets())

    // Assert — only ws-1 belongs to cat-1
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].id).toBe('ws-1')
  })

  it('should_filter_worksheets_by_keyword', async () => {
    // Arrange — keyword that matches only ws-3
    useFilterStore.setState({ selectedCategoryId: null, selectedSubcategoryId: null, keyword: 'Fractions' })

    // Act
    const { result } = renderHookWithProviders(() => useWorksheets())

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].id).toBe('ws-3')
  })

  it('should_return_empty_array_when_no_worksheets_match_filter', async () => {
    // Arrange
    useFilterStore.setState({ selectedCategoryId: null, selectedSubcategoryId: null, keyword: 'xyznonexistent' })

    // Act
    const { result } = renderHookWithProviders(() => useWorksheets())

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(0)
  })
})

describe('useWorksheet', () => {
  it('should_return_worksheet_by_id', async () => {
    // Arrange + Act
    const { result } = renderHookWithProviders(() => useWorksheet('ws-1'))

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe('ws-1')
    expect(result.current.data?.title).toBe('Counting Objects 1–10')
  })

  it('should_be_disabled_when_id_is_empty', () => {
    // Arrange + Act
    const { result } = renderHookWithProviders(() => useWorksheet(''))

    // Assert — query stays idle
    expect(result.current.isPending).toBe(true)
    expect(result.current.isFetching).toBe(false)
  })
})

describe('useCategories', () => {
  it('should_return_all_14_common_core_categories', async () => {
    // Arrange + Act
    const { result } = renderHookWithProviders(() => useCategories())

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(14)
  })

  it('should_include_subcategories_nested_within_each_category', async () => {
    // Arrange + Act
    const { result } = renderHookWithProviders(() => useCategories())

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const geometry = result.current.data?.find((c) => c.name === 'Geometry')
    expect(geometry?.subcategories.length).toBeGreaterThan(0)
  })
})
