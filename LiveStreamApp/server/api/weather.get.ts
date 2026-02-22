export default defineCachedEventHandler(async (event) => {
  try {
    // Coordinates for Yverdon-les-Bains
    const latitude = 46.7785
    const longitude = 6.6412

    // Use Open-Meteo public API (no key required)
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current_weather: 'true',
      temperature_unit: 'celsius',
      timezone: 'Europe/Zurich'
    })
    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`

    console.log('[weather] Fetching', url)

    // Using $fetch which automatically throws on error
    const resp = await $fetch<any>(url)

    const temperature = resp?.current_weather?.temperature ?? null

    return {
      temperature,
      raw: resp
    }
  } catch (err: any) {
    console.error('[weather] Error fetching weather:', err.message)
    // Throw error to propagate 500 to client and prevent caching of bad data
    throw createError({
      statusCode: 503,
      statusMessage: 'Weather Service Unavailable',
      message: err.message
    })
  }
}, {
  maxAge: 60 * 15, // 15 minutes
  swr: true,
  name: 'weather-forecast',
  getKey: () => 'yverdon' // Single key as coordinates are hardcoded
})
