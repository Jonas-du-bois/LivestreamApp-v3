import { Server as IOServer } from 'socket.io'

export default defineNitroPlugin((nitroApp: any) => {
  // Optionnel : On récupère la config si on veut restreindre les origines (CORS)
  const config = useRuntimeConfig() // used below to set CORS origin

  // @ts-ignore: Nitro hook typing mismatch workaround
  nitroApp.hooks.hook('request', (event: any) => {
    // 1. Sécurité : on s'assure qu'on a bien accès aux objets Node
    if (!event.node) return
    
    // On force le type 'any' pour éviter les erreurs "Property does not exist"
    const req = event.node.req
    const res = event.node.res as any
    
    if (!res) return
    
    // 2. Récupération du socket (C'est ici que ça bloquait souvent en rouge)
    const server = res.socket?.server
    if (!server) return

    // 3. Singleton : Si Socket.io tourne déjà, on arrête tout de suite
    if (server.io) return

    // 4. Initialisation du serveur Socket.io
    const io = new IOServer(server, {
      path: '/socket.io',
      cors: {
        // En prod, restreindre aux origines de config si disponible
        origin: (config && config.public && config.public.siteUrl) ? config.public.siteUrl : '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    })

    // 5. On attache l'instance IO au serveur pour ne pas le recréer au prochain appel
    server.io = io
    
    // 6. On le rend global pour pouvoir l'utiliser dans tes API (ex: POST /admin/score)
    ;(globalThis as any).io = io 

    // 7. Gestion des événements Socket
    io.on('connection', (socket) => {
      console.log('[Socket.io] Client connecté :', socket.id)

      // Helper: Validate room name to prevent arbitrary joins
      const isValidRoom = (room: string): boolean => {
        // Allow standard public rooms
        if (['live-scores', 'schedule-updates', 'streams'].includes(room)) return true
        // Allow specific stream rooms (stream-<ObjectId>)
        if (/^stream-[0-9a-fA-F]{24}$/.test(room)) return true

        return false
      }

      // Gestion des salles (Rooms)
      socket.on('join-room', (room: string) => {
        if (typeof room === 'string') {
          // Security: Validate room name
          if (!isValidRoom(room)) {
            console.warn(`[Socket.io] Security: Blocked attempt by ${socket.id} to join invalid room: ${room}`)
            return
          }

          socket.join(room)
          console.log(`[Socket.io] Socket ${socket.id} a rejoint la salle : ${room}`)
          // Log current rooms for this socket
          console.log(`[Socket.io] Socket ${socket.id} rooms:`, Array.from(socket.rooms))
        }
      })

      socket.on('leave-room', (room: string) => {
        if (typeof room === 'string') {
          socket.leave(room)
          console.log(`[Socket.io] Socket ${socket.id} a quitté la salle : ${room}`)
        }
      })
      
      socket.on('disconnect', (reason) => {
        console.log(`[Socket.io] Socket ${socket.id} déconnecté:`, reason)
      })
    })

    console.log('✅ [Socket.io] Serveur initialisé avec succès')
  })
})