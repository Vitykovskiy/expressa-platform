import type { ApiError } from '../shared/api/client'
import type { ScreenError } from '../shared/ui/screen-error'

export function mapApiErrorToScreenError(error: ApiError): ScreenError {
  return {
    message: error.message,
    requestId: error.requestId,
  }
}
