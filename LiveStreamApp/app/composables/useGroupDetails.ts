/**
 * État partagé pour le modal de détails d'un groupe.
 * Utilise useState pour persister entre les navigations.
 */
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
  }

  return {
    isOpen,
    groupId,
    apparatusCode,
    open,
    close
  }
}
