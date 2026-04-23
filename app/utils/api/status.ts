import type { StatusContextResponse, StatusDetailResponse } from '#shared/types/status'

export function fetchStatusDetail(id: string): Promise<StatusDetailResponse> {
  return $fetch<StatusDetailResponse>(`/api/timeline/status/${id}`, {
    method: 'GET'
  })
}

export function fetchStatusContext(id: string): Promise<StatusContextResponse> {
  return $fetch<StatusContextResponse>(`/api/timeline/status/${id}/context`, {
    method: 'GET'
  })
}
