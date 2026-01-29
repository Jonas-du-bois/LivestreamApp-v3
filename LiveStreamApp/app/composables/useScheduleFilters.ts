export const useScheduleFilters = () => useState('scheduleFilters', () => ({
  division: [] as string[],
  salle: [] as string[],
  apparatus: [] as string[]
}))
