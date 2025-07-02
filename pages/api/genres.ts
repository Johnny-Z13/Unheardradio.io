import type { NextApiRequest, NextApiResponse } from 'next'

interface Genre {
  name: string
  stationcount: number
}

const RADIO_BROWSER_SERVERS = [
  'https://nl1.api.radio-browser.info',
  'https://de1.api.radio-browser.info',
  'https://at1.api.radio-browser.info'
]

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Genre[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let genres: Genre[] = []
    let lastError: Error | null = null
    
    for (const server of RADIO_BROWSER_SERVERS) {
      try {
        const response = await fetch(`${server}/json/tags`, {
          headers: {
            'User-Agent': 'UnheardRadio/1.0',
          },
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        genres = await response.json()
        break
      } catch (error) {
        lastError = error as Error
        continue
      }
    }
    
    if (genres.length === 0 && lastError) {
      throw lastError
    }
    
    // Filter out technical/frequency terms and focus on music genres
    const filteredGenres = genres.filter(genre => {
      const name = genre.name.toLowerCase()
      return !name.match(/\d+(\.\d+)?\s*(hz|khz|mhz|kbps|mbps|fm|am|dab|stereo|mono|digital|analog|frequency|bitrate)/) &&
             !name.match(/^\d+$/) &&
             genre.stationcount > 0
    })
    
    // Sort by station count and take top 100
    filteredGenres.sort((a, b) => b.stationcount - a.stationcount)
    
    res.status(200).json(filteredGenres.slice(0, 100))
  } catch (error) {
    console.error('Error fetching genres:', error)
    res.status(500).json({ error: 'Failed to fetch genres' })
  }
}