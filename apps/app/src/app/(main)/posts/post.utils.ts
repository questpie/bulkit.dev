import { type Platform, PLATFORM_TO_NAME } from '@bulkit/shared/constants/db.constants'
import type { PostValidationResultSchema } from '@bulkit/shared/modules/posts/posts.schemas'
import type { Static } from '@sinclair/typebox'
import type { UseFormReturn } from 'react-hook-form'

export function setPostValidationErrors(
  form: UseFormReturn<any>,
  errors: Static<typeof PostValidationResultSchema>
) {
  const errorsByPath: Record<string, string[]> = {}

  for (const error of errors.common) {
    if (!errorsByPath[error.path]) {
      errorsByPath[error.path] = []
    }
    errorsByPath[error.path]!.push(error.message)
  }

  for (const platform in errors.platforms) {
    const platformErrors = errors.platforms[platform as Platform]
    for (const error of platformErrors) {
      if (!errorsByPath[error.path]) {
        errorsByPath[error.path] = []
      }
      errorsByPath[error.path]!.push(`${PLATFORM_TO_NAME[platform as Platform]}: ${error.message}`)
    }
  }

  for (const path in errorsByPath) {
    form.setError(path, {
      type: 'manual',
      message: errorsByPath[path]!.join('\n'),
    })
  }
}
