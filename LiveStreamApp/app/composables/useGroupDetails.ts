export const useGroupDetails = () => {
  const isOpen = useState<boolean>('group-details-open', () => false)
  const groupId = useState<string>('group-details-id', () => '')
  const apparatusCode = useState<string | undefined>('group-details-apparatus', () => undefined)

  const open = (id: string, code?: string) => {
    groupId.value = id
    apparatusCode.value = code
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
    // Optional: clear data on close if needed, but keeping it might be useful for transitions
    // groupId.value = ''
    // apparatusCode.value = undefined
  }

  return {
    isOpen,
    groupId,
    apparatusCode,
    open,
    close
  }
}
