export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface OrgBalance {
  totalCollected: number
  totalPayouts: number
  available: number
}