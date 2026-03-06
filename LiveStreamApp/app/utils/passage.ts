import type { PassageStatus } from '~/types/api'

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
