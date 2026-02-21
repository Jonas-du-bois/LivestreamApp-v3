import type { PassageEnriched } from './api'

export interface PassageSearchable extends PassageEnriched {
  _dayKey: string
  _apparatusCodeKey: string
  _apparatusNameKey: string
  _groupNameKey: string
  _locationKey: string
  _categoryKey: string
  _searchIndex: string
}
