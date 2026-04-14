import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { worksheetFormSchema, type WorksheetFormInput } from '@/api/worksheets'
import { useCategories } from '@/features/worksheets'
import { cn } from '@/utils/cn'

interface WorksheetFormProps {
  defaultValues?: Partial<WorksheetFormInput>
  onSubmit: (data: WorksheetFormInput) => void
  isPending?: boolean
}

const GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

export function WorksheetForm({ defaultValues, onSubmit, isPending }: WorksheetFormProps) {
  const { data: categories } = useCategories()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<WorksheetFormInput>({
    resolver: zodResolver(worksheetFormSchema),
    defaultValues: { schoolGrade: null, ...defaultValues },
  })

  const selectedCategoryId = watch('categoryId')
  const subcategories = categories?.find((c) => c.id === selectedCategoryId)?.subcategories ?? []

  useEffect(() => {
    if (defaultValues) {
      Object.entries(defaultValues).forEach(([key, val]) => {
        setValue(key as keyof WorksheetFormInput, val as WorksheetFormInput[keyof WorksheetFormInput])
      })
    }
  }, [defaultValues, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input {...register('title')} className={cn('w-full rounded-md border px-3 py-2 text-sm', errors.title ? 'border-red-500' : 'border-gray-300')} />
        {errors.title && <p className="text-xs text-red-600 mt-0.5">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select {...register('categoryId')} className={cn('w-full rounded-md border px-3 py-2 text-sm', errors.categoryId ? 'border-red-500' : 'border-gray-300')}>
            <option value="">Select…</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.categoryId && <p className="text-xs text-red-600 mt-0.5">{errors.categoryId.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
          <select {...register('subcategoryId')} className={cn('w-full rounded-md border px-3 py-2 text-sm', errors.subcategoryId ? 'border-red-500' : 'border-gray-300')}>
            <option value="">Select…</option>
            {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.subcategoryId && <p className="text-xs text-red-600 mt-0.5">{errors.subcategoryId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
          <select {...register('level')} className={cn('w-full rounded-md border px-3 py-2 text-sm', errors.level ? 'border-red-500' : 'border-gray-300')}>
            <option value="">Select…</option>
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          {errors.level && <p className="text-xs text-red-600 mt-0.5">{errors.level.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grade (optional)</label>
          <select {...register('schoolGrade')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">—</option>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
        <input {...register('author')} defaultValue="PizzaMath" className={cn('w-full rounded-md border px-3 py-2 text-sm', errors.author ? 'border-red-500' : 'border-gray-300')} />
        {errors.author && <p className="text-xs text-red-600 mt-0.5">{errors.author.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Worksheet Content</label>
        <textarea {...register('content')} rows={8} className={cn('w-full rounded-md border px-3 py-2 text-sm font-mono resize-y', errors.content ? 'border-red-500' : 'border-gray-300')} />
        {errors.content && <p className="text-xs text-red-600 mt-0.5">{errors.content.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Answer Sheet</label>
        <textarea {...register('answerContent')} rows={4} className={cn('w-full rounded-md border px-3 py-2 text-sm font-mono resize-y', errors.answerContent ? 'border-red-500' : 'border-gray-300')} />
        {errors.answerContent && <p className="text-xs text-red-600 mt-0.5">{errors.answerContent.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Save Worksheet'}
      </button>
    </form>
  )
}
