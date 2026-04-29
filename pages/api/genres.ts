import type { NextApiRequest, NextApiResponse } from 'next'
import { radioBrowserFetch } from '@/lib/radio-browser'
import type { Genre } from '@/types/radio'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Genre[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await radioBrowserFetch('/json/tags')
    const genres: Genre[] = await response.json()

    // Drop frequency/bitrate/technical entries; keep musical genres
    const filtered = genres.filter(genre => {
      const name = genre.name.toLowerCase()
      return (
        !name.match(/\d+(\.\d+)?\s*(hz|khz|mhz|kbps|mbps|fm|am|dab|stereo|mono|digital|analog|frequency|bitrate)/) &&
        !name.match(/^\d+$/) &&
        genre.stationcount > 0
      )
    })

    filtered.sort((a, b) => b.stationcount - a.stationcount)
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json(filtered.slice(0, 100))
  } catch (error) {
    console.error('Error fetching genres:', error)
    res.status(502).json({ error: 'Failed to fetch genres' })
  }
}
