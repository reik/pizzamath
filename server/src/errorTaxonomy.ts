export const ERROR_CATEGORIES = [
  { id: 'arithmetic_fact', label: 'Arithmetic fact error' },
  { id: 'regrouping', label: 'Carry/borrow error' },
  { id: 'place_value', label: 'Place-value misalignment' },
  { id: 'operation_confusion', label: 'Wrong operation' },
  { id: 'sign_error', label: 'Sign / negative-number error' },
  { id: 'fraction_common_denominator', label: 'Missing common denominator' },
  { id: 'fraction_simplification', label: 'Did not simplify fraction' },
  { id: 'decimal_point', label: 'Decimal-point misplacement' },
  { id: 'word_problem_setup', label: 'Misread the word problem' },
  { id: 'order_of_operations', label: 'PEMDAS violation' },
  { id: 'missed_step', label: 'Skipped a sub-step' },
  { id: 'conceptual', label: 'Conceptual misunderstanding' },
  { id: 'careless', label: 'Careless (right method, wrong answer)' },
] as const

export type ErrorCategoryId = (typeof ERROR_CATEGORIES)[number]['id']

const ID_SET = new Set<string>(ERROR_CATEGORIES.map((c) => c.id))
export function isErrorCategoryId(value: unknown): value is ErrorCategoryId {
  return typeof value === 'string' && ID_SET.has(value)
}
