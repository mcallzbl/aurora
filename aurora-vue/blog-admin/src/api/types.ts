export interface ApiResponse<T> {
  flag: boolean
  message?: string
  code?: number
  data: T
}

export interface ApiSuccess<T> {
  ok: true
  data: T
  message?: string
  raw: ApiResponse<T>
}

export interface ApiFailure {
  ok: false
  message: string
  code?: number
  raw?: ApiResponse<unknown>
  error?: unknown
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure

export interface PageData<T> {
  records: T[]
  count: number
}

export interface RequestOptions {
  silent?: boolean
}
