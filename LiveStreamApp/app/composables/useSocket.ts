export const useSocket = () => {
  const { $socket } = useNuxtApp()
  return $socket
}
