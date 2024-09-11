/**
 *  taken from https://github.com/jcwillox/typebox-x/blob/main/src/tools/utils.ts
 */
import type { ValueError, ValueErrorType, ValueErrorIterator } from '@sinclair/typebox/errors'

export type MergedValueError = Omit<ValueError, 'type' | 'message'> & {
  errors: {
    type: ValueErrorType
    message: string
  }[]
}

/**
 * Merges multiple errors for a path into a single object per path,
 * with an array of errors, see {@link MergedValueError}.
 *
 * @param errors - The errors to merge.
 * @param stripEmptyPaths - Whether to strip errors with empty paths.
 */
export function mergeErrors(
  errors: ValueErrorIterator | ValueError[],
  stripEmptyPaths = true
): MergedValueError[] {
  const mergedErrors: Record<string, MergedValueError> = {}
  for (const { message, type, ...error } of errors) {
    if (error.path in mergedErrors) {
      mergedErrors[error.path].errors.push({ type, message })
    } else if (!stripEmptyPaths || error.path) {
      mergedErrors[error.path] = {
        ...error,
        errors: [{ type, message }],
      }
    }
  }
  return Object.values(mergedErrors)
}
