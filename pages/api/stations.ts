import type { NextApiRequest, NextApiResponse } from 'next'
import { RadioStation, SearchFilters } from '@/types/radio'

const RADIO_BROWSER_SERVERS = [
  'https://nl1.api.radio-browser.info',
  'https://de1.api.radio-browser.info',
  'https://at1.api.radio-browser.info'
]

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
      listenerFilter: req.query.listenerFilter as string,
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0,
    }

    let url = `/json/stations/search`
    const params = new URLSearchParams()
    
    // Add search parameters
    if (filters.search) {
      params.append('name', filters.search)
    }
    
    if (filters.country) {
      params.append('country', filters.country)
    }
    
    if (filters.genre) {
      params.append('tag', filters.genre)
    }
    
    params.append('limit', filters.limit?.toString() || '20')
    params.append('offset', filters.offset?.toString() || '0')
    params.append('hidebroken', 'true')
    
    // Try multiple servers for reliability
    let stations: RadioStation[] = []
    let lastError: Error | null = null
    
    for (const server of RADIO_BROWSER_SERVERS) {
      try {
        const response = await fetch(`${server}${url}?${params.toString()}`, {
          headers: {
            'User-Agent': 'UnheardRadio/1.0',
          },
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        stations = await response.json()
        break // Success, exit the loop
      } catch (error) {
        lastError = error as Error
        continue // Try next server
      }
    }
    
    if (stations.length === 0 && lastError) {
      throw lastError
    }
    
    // Apply listener filtering and sorting
    if (filters.listenerFilter) {
      switch (filters.listenerFilter) {
        case 'zero':
          stations = stations.filter(s => s.clickcount === 0)
          break
        case 'hide-zero':
          stations = stations.filter(s => s.clickcount > 0)
          break
        case 'high-to-low':
          stations.sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0))
          break
        case 'low-to-high':
          stations.sort((a, b) => (a.clickcount || 0) - (b.clickcount || 0))
          break
      }
    } else {
      // Default to low-to-high sorting (obscure first)
      stations.sort((a, b) => (a.clickcount || 0) - (b.clickcount || 0))
    }
    
    res.status(200).json(stations)
  } catch (error) {
    console.error('Error fetching stations:', error)
    res.status(500).json({ error: 'Failed to fetch stations' })
  }
}