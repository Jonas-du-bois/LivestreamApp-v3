export default defineCachedEventHandler(async (event) => {
  try {
    // Coordinates for Yverdon-les-Bains
    const latitude = 46.7785
    const longitude = 6.6412

    // Use Open-Meteo public API (no key required) via native fetch
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current_weather: 'true',
      temperature_unit: 'celsius'
    })
    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`

    console.log('[weather] Fetching', url)

    // Try twice before failing to be a bit more resilient to transient network issues
    let resp: any = null
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const r = await fetch(url)
        if (!r.ok) {
          const txt = await r.text().catch(() => '<no-body>')
          console.error(`[weather] upstream fetch failed (attempt ${attempt})`, r.status, txt)
          if (attempt === 2) throw new Error('Upstream fetch failed')
          // otherwise retry
          continue
        }
        resp = await r.json()
        break
      } catch (e: any) {
        console.error(`[weather] fetch error (attempt ${attempt})`, e?.stack || e)
        if (attempt === 2) throw e
      }
    }

    const temperature = resp?.current_weather?.temperature ?? null

    return {
      temperature,
      raw: resp
    }
  } catch (err) {
    // Log full error for debugging but return a safe fallback to avoid crashing SSR
    console.error('[weather] Error fetching weather', err)
    return {
      temperature: null,
      raw: null
    }
  }
}, {
  maxAge: 900, // Cache for 15 minutes
  swr: true, // Serve stale content while revalidating
  name: 'api-weather',
  getKey: () => 'yverdon' // Constant key since coordinates are hardcoded
})