export default defineEventHandler((event) => {
  const res = (event.node?.res as any)
  const server = res?.socket?.server
  const hasIo = !!server?.io
  const socketsCount = hasIo ? (server.io.sockets ? Object.keys(server.io.sockets.sockets || {}).length : 0) : 0

  return {
    ok: true,
    hasIo,
    socketsCount
  }
})