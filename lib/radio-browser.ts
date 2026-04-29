const RADIO_BROWSER_SERVERS = [
  'https://nl1.api.radio-browser.info',
  'https://de1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
] as const

export async function radioBrowserFetch(path: string, init?: RequestInit): Promise<Response> {
  let lastError: Error | null = null

  for (const server of RADIO_BROWSER_SERVERS) {
    try {
      const response = await fetch(`${server}${path}`, {
        ...init,
        headers: {
          'User-Agent': 'UnheardRadio/1.0',
          ...(init?.headers || {}),
        },
      })
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} from ${server}`)
        continue
      }
      return response
    } catch (error) {
      lastError = error as Error
      continue
    }
  }

  throw lastError ?? new Error('All RadioBrowser mirrors failed')
}
