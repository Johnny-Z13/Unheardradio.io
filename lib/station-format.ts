import type { RadioStation } from '@/types/radio'

export function getBand(station: RadioStation): 'FM' | 'AM' | 'SW' | 'WEB' {
  const haystack = `${station.name} ${station.tags || ''}`.toLowerCase()
  if (/\bshortwave\b|\bsw\b/.test(haystack)) return 'SW'
  if (/\bam\b\s*\d{3,4}|\d{3,4}\s*\bam\b/.test(haystack)) return 'AM'
  if (/\bfm\b|f\.m\./.test(haystack)) return 'FM'
  return 'WEB'
}

export function getStationId(station: RadioStation): string {
  if (!station.stationuuid) return '----'
  return station.stationuuid.replace(/-/g, '').slice(0, 4).toUpperCase()
}

export function getCoords(station: RadioStation): string {
  const lat = station.geo_lat
  const lon = station.geo_long
  if (lat == null || lon == null || (lat === 0 && lon === 0)) return 'COORDS UNKNOWN'
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(1)}°${ns} ${Math.abs(lon).toFixed(1)}°${ew}`
}

const COUNTRY_SHORT: Record<string, string> = {
  'United States of America': 'USA',
  'United States': 'USA',
  'United Kingdom': 'UK',
  'United Kingdom of Great Britain and Northern Ireland': 'UK',
  'Russian Federation': 'Russia',
}

export function getOrigin(station: RadioStation): string {
  const cc = station.countrycode?.toUpperCase() || ''
  const name = COUNTRY_SHORT[station.country] || station.country || ''
  if (cc && name) return `${cc} / ${name.toUpperCase()}`
  if (name) return name.toUpperCase()
  return '— / UNKNOWN'
}

export function getRate(station: RadioStation): string {
  if (!station.bitrate) return '—'
  const codec = (station.codec || 'MP3').toUpperCase()
  return `${station.bitrate}k ${codec}`
}

export function getUptime(station: RadioStation): string {
  if (!station.lastchangetime) return '—'
  const last = new Date(station.lastchangetime).getTime()
  if (Number.isNaN(last)) return '—'
  const days = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24))
  if (days < 1) return '<1d'
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  const years = Math.floor(days / 365)
  const remDays = days - years * 365
  return remDays > 0 ? `${years}y ${remDays}d` : `${years}y`
}
