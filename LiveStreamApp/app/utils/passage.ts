import type { PassageStatus } from '~/types/api'

export const getPassageStatusColor = (status?: PassageStatus | string) => {
  switch (status) {
    case 'SCHEDULED': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    case 'LIVE': return 'bg-red-500/20 text-red-300 border border-red-500/30'
    case 'FINISHED': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    default: return 'bg-white/10 text-white/50'
  }
}

export const getPassageStatusIcon = (status?: PassageStatus | string) => {
  switch (status) {
    case 'SCHEDULED': return 'fluent:calendar-clock-24-regular'
    case 'LIVE': return 'fluent:record-24-filled'
    case 'FINISHED': return 'fluent:checkmark-circle-24-filled'
    default: return 'fluent:circle-24-regular'
  }
}

/**
 * Computes the dynamic status of a passage based on its start time, end time, and the current timestamp.
 * Client-side status calculation overrides stale server status based on time.
 *
 * @param startTime - The start timestamp of the passage (in milliseconds)
 * @param endTime - The end timestamp of the passage (in milliseconds)
 * @param now - The current timestamp (in milliseconds)
 * @param serverStatus - The original status returned by the server
 * @returns The computed dynamic status ('SCHEDULED', 'LIVE', or 'FINISHED')
 */
export const computePassageStatus = (
  startTime: number,
  endTime: number,
  now: number,
  serverStatus: PassageStatus | 'LIVE'
): PassageStatus | 'LIVE' => {
  let status = serverStatus

  if (now >= startTime && now <= endTime) {
    status = 'LIVE'
  } else if (now > endTime) {
    status = 'FINISHED'
  } else if (now < startTime && (status === 'LIVE' || status === 'FINISHED')) {
    // If time says upcoming but server says LIVE/FINISHED (stale), reset it
    status = 'SCHEDULED'
  }

  return status
}
