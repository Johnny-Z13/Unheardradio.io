import type { NextApiRequest, NextApiResponse } from 'next'
import { radioBrowserFetch } from '@/lib/radio-browser'
import type { RadioStation } from '@/types/radio'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RadioStation | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { uuid } = req.query
  if (typeof uuid !== 'string' || !/^[0-9a-f-]{36}$/i.test(uuid)) {
    return res.status(400).json({ error: 'Invalid station uuid' })
  }

  try {
    const response = await radioBrowserFetch(`/json/stations/byuuid/${uuid}`)
    const stations: RadioStation[] = await response.json()
    const station = stations[0]

    if (!station) {
      return res.status(404).json({ error: 'Station not found' })
    }

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
    res.status(200).json(station)
  } catch (error) {
    console.error('Failed to fetch station:', error)
    res.status(502).json({ error: 'Failed to fetch station' })
  }
}
