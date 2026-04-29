import type { NextApiRequest, NextApiResponse } from 'next'
import { radioBrowserFetch } from '@/lib/radio-browser'
import type { Country } from '@/types/radio'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Country[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await radioBrowserFetch('/json/countries')
    const countries: Country[] = await response.json()
    countries.sort((a, b) => b.stationcount - a.stationcount)
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json(countries.slice(0, 50))
  } catch (error) {
    console.error('Error fetching countries:', error)
    res.status(502).json({ error: 'Failed to fetch countries' })
  }
}
