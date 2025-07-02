import type { NextApiRequest, NextApiResponse } from 'next'

interface Country {
  name: string
  iso_3166_1: string
  stationcount: number
}

const RADIO_BROWSER_SERVERS = [
  'https://nl1.api.radio-browser.info',
  'https://de1.api.radio-browser.info',
  'https://at1.api.radio-browser.info'
]

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Country[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let countries: Country[] = []
    let lastError: Error | null = null
    
    for (const server of RADIO_BROWSER_SERVERS) {
      try {
        const response = await fetch(`${server}/json/countries`, {
          headers: {
            'User-Agent': 'UnheardRadio/1.0',
          },
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        countries = await response.json()
        break
      } catch (error) {
        lastError = error as Error
        continue
      }
    }
    
    if (countries.length === 0 && lastError) {
      throw lastError
    }
    
    // Sort by station count and take top 50
    countries.sort((a, b) => b.stationcount - a.stationcount)
    countries = countries.slice(0, 50)
    
    res.status(200).json(countries)
  } catch (error) {
    console.error('Error fetching countries:', error)
    res.status(500).json({ error: 'Failed to fetch countries' })
  }
}