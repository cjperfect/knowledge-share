export interface ApiErrorBody {
  msg?: string
  message?: string | string[]
}

export interface ApiResponse<T> extends ApiErrorBody {
  code: number
  data: T
}
