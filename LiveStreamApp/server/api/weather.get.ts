export default defineEventHandler(async (event) => {
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
    const r = await fetch(url)
    if (!r.ok) {
      console.error('[weather] upstream fetch failed', r.status, await r.text())
      throw new Error('Upstream fetch failed')
    }

    const resp = await r.json()
    const temperature = resp?.current_weather?.temperature ?? null

    return {
      temperature,
      raw: resp
    }
  } catch (err) {
    console.error('[weather] Error fetching weather', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch weather' })
  }
})