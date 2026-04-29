import type { NextApiRequest, NextApiResponse } from 'next'
import { radioBrowserFetch } from '@/lib/radio-browser'

interface Stats {
  stations: number
  countries: number
  languages: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Stats | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await radioBrowserFetch('/json/stats')
    const data = await response.json()
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600')
    res.status(200).json({
      stations: data.stations_broken !== undefined
        ? data.stations - data.stations_broken
        : data.stations,
      countries: data.countries,
      languages: data.languages,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    res.status(502).json({ error: 'Failed to fetch stats' })
  }
}
