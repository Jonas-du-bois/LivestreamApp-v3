export const useScheduleFilters = () => useState('scheduleFilters', () => ({
  salle: [] as string[],
  apparatus: [] as string[],
  hidePast: false
}))
