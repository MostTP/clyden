export type ApiErrorPayload = {
  error: string
  code: string
  status: number
}

export function buildErrorPayload(message: string, status = 400, code = 'API_ERROR') {
  return { error: message, code, status }
}

export function buildSuccessPayload<T>(data: T, meta?: Record<string, unknown>) {
  return meta ? { data, meta } : { data }
}
