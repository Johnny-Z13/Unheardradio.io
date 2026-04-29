import type { NextApiRequest, NextApiResponse } from 'next'
import { radioBrowserFetch } from '@/lib/radio-browser'
import type { RadioStation, SearchFilters } from '@/types/radio'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RadioStation[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const filters: SearchFilters = {
      search: req.query.search as string,
      country: req.query.country as string,
      genre: req.query.genre as string,
      listenerFilter: req.query.listenerFilter as SearchFilters['listenerFilter'],
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0,
    }

    const params = new URLSearchParams()
    if (filters.search) params.append('name', filters.search)
    if (filters.country) params.append('country', filters.country)
    if (filters.genre) params.append('tag', filters.genre)

    // Zero-listener mode pulls a wider net so post-filter still has variety
    const requestLimit = filters.listenerFilter === 'zero' ? '1000' : (filters.limit?.toString() || '20')
    params.append('limit', requestLimit)
    params.append('offset', filters.offset?.toString() || '0')
    params.append('hidebroken', 'true')

    if (filters.listenerFilter === 'zero' || filters.listenerFilter === 'low-to-high') {
      params.append('order', 'clickcount')
      params.append('reverse', 'false')
    }

    const response = await radioBrowserFetch(`/json/stations/search?${params.toString()}`)
    let stations: RadioStation[] = await response.json()

    switch (filters.listenerFilter) {
      case 'zero':
        stations = stations.filter(s => (s.clickcount || 0) <= 5)
        stations.sort((a, b) => (a.clickcount || 0) - (b.clickcount || 0))
        break
      case 'hide-zero':
        stations = stations.filter(s => s.clickcount > 0)
        stations.sort((a, b) => (a.clickcount || 0) - (b.clickcount || 0))
        break
      case 'high-to-low':
        stations.sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0))
        break
      case 'low-to-high':
      default:
        stations.sort((a, b) => (a.clickcount || 0) - (b.clickcount || 0))
        break
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    res.status(200).json(stations)
  } catch (error) {
    console.error('Error fetching stations:', error)
    res.status(502).json({ error: 'Failed to fetch stations' })
  }
}
