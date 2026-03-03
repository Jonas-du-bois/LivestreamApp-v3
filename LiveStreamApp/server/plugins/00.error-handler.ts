/**
 * Plugin Nitro : gestion globale des erreurs réseau bas niveau.
 *
 * ECONNRESET / EPIPE sont des erreurs TCP normales (un client s'est déconnecté
 * avant que le serveur ait fini de répondre). En mode dev, Nuxt/HMR génère
 * régulièrement ce type de connexion éphémère.
 * Sans ce handler, ces erreurs remontent en `unhandledRejection` et provoquent
 * un redémarrage inutile du serveur Nuxt.
 */
export default defineNitroPlugin(() => {
  const IGNORED_CODES = new Set(['ECONNRESET', 'EPIPE', 'ECONNABORTED'])

  process.on('unhandledRejection', (reason: any) => {
    const code = reason?.code ?? reason?.cause?.code ?? ''
    if (IGNORED_CODES.has(code)) {
      // Erreur réseau bénigne – on ignore silencieusement
      return
    }
    // Pour toute autre erreur non gérée, on laisse Nuxt la traiter normalement
    console.error('[unhandledRejection]', reason)
  })

  process.on('uncaughtException', (err: any) => {
    const code = err?.code ?? ''
    if (IGNORED_CODES.has(code)) {
      return
    }
    console.error('[uncaughtException]', err)
    // Pour les vraies exceptions non catchées hors erreurs réseau, on laisse le process crasher
    process.exit(1)
  })
})
