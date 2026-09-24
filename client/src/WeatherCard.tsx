import { useEffect, useId, useState } from 'react'
import './WeatherCard.css'

// Open-Meteo is free for noncommercial teaching use and needs no API key.
// Change these values together to use another location.
const location = { name: 'San Pedro, Belize', latitude: 17.92, longitude: -87.97 }
const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m&temperature_unit=celsius`

type WeatherResponse = {
  current?: { temperature_2m?: number }
}

// An async function also returns a Promise. await pauses this
// function until a Promise settles; it does not freeze the page.
async function loadWithFetch(signal: AbortSignal): Promise<WeatherResponse> {
  const response = await fetch(weatherUrl, { signal })

  // Unlike Axios, fetch does not reject automatically for HTTP error statuses.
  if (!response.ok) {
    throw new Error(`Weather request failed (HTTP ${response.status}).`)
  }

  // Fetch needs this second asynchronous step to parse JSON into an object.
  const data: WeatherResponse = await response.json()
  return data
}

const weatherRequest = loadWithFetch

// Reuse with only an import and <WeatherCard />. Requests, state, and styles
// belong to this component; the parent does not need to manage the weather.
function WeatherCard() {
  const id = useId() // Unique labels even when a page has multiple cards.
  const [refreshCount, setRefreshCount] = useState(0)
  const [temperature, setTemperature] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError('')
    setTemperature(null)

    // A stalled connection should eventually offer a retry.
    const timeout = window.setTimeout(() => {
      controller.abort()
      setError('The weather request timed out. Please try again.')
      setIsLoading(false)
    }, 15000)

    // Effects must return cleanup functions, not Promises, so define an
    // async function inside the effect and then call it.
    async function loadWeather() {
      try {
        const data = await weatherRequest(controller.signal)

        // TypeScript describes the expected shape, but the actual API response
        // still needs checking. Zero degrees is a valid temperature.
        const nextTemperature = data?.current?.temperature_2m
        if (typeof nextTemperature !== 'number' || !Number.isFinite(nextTemperature)) {
          throw new Error('The weather service did not return a valid temperature.')
        }

        if (!controller.signal.aborted) {
          // State changes cause React to render again and update the DOM.
          // No document.getElementById() or innerHTML is needed.
          setTemperature(nextTemperature)
        }
      } catch {
        // A rejected Promise (network, HTTP, or parsing failure) lands here.
        if (!controller.signal.aborted) {
          setError('Unable to load the temperature. Please try again.')
        }
      } finally {
        window.clearTimeout(timeout)
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadWeather()

    // Cancel on unmount or before a new request so old responses cannot
    // overwrite new state. This also handles React Strict Mode's cleanup.
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [refreshCount]) // Fetch on mount or refresh.

  return (
    <section className="weather-card" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>Weather</h2>
      <p>{location.name}</p>
      <div role="status" aria-live="polite" aria-busy={isLoading}>
        <p className="weather-card-temperature">
          {temperature === null ? '--' : `${temperature.toFixed(1)} °C`}
        </p>
        <p>{isLoading ? 'Loading weather…' : temperature === null ? 'Temperature unavailable' : 'Current temperature'}</p>
      </div>
      {error && <p className="weather-card-error" role="alert">{error}</p>}

      <div className="weather-card-controls">
        <button type="button" disabled={isLoading} onClick={() => setRefreshCount((count) => count + 1)}>
          {isLoading ? 'Loading…' : error ? 'Try again' : 'Refresh weather'}
        </button>
      </div>
      <p className="weather-card-source">Weather data by <a href="https://open-meteo.com/">Open-Meteo</a></p>
    </section>
  )
}

export default WeatherCard
