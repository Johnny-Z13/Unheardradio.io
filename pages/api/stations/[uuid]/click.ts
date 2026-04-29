import type { NextApiRequest, NextApiResponse } from 'next'
import { radioBrowserFetch } from '@/lib/radio-browser'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { uuid } = req.query
  if (typeof uuid !== 'string' || !/^[0-9a-f-]{36}$/i.test(uuid)) {
    return res.status(400).json({ error: 'Invalid station uuid' })
  }

  try {
    const response = await radioBrowserFetch(`/json/url/${uuid}`)
    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('Failed to register click:', error)
    res.status(502).json({ error: 'Failed to register click' })
  }
}
