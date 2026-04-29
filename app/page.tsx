'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SearchSidebar } from '@/components/search-sidebar'
import { DiscoveryList } from '@/components/discovery-list'
import { BookmarkList } from '@/components/bookmark-list'
import { StationMap } from '@/components/station-map-simple'
import { NowPlayingBar } from '@/components/now-playing-bar'
import { FullscreenStation } from '@/components/fullscreen-station'
import { RadioStation, SearchFilters } from '@/types/radio'
import { useAudioStore } from '@/lib/audio-store'
import { Radar, Search, Bookmark, MapPin, Info } from 'lucide-react'

type Tab = 'discover' | 'search' | 'saved' | 'map' | 'about'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('discover')
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    listenerFilter: 'low-to-high',
    limit: 20,
    offset: 0,
  })
  const [fullscreenStation, setFullscreenStation] = useState<RadioStation | null>(null)

  const { currentStation, playStation } = useAudioStore()

  const { data: stats } = useQuery<{ stations: number }>({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('stats')
      return res.json()
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  // Deep link: ?station=<uuid> auto-plays that station via RadioBrowser lookup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const uuid = params.get('station')
    if (!uuid) return

    let cancelled = false
    fetch(`https://de1.api.radio-browser.info/json/stations/byuuid/${uuid}`, {
      headers: { 'User-Agent': 'UnheardRadio/1.0' },
    })
      .then(r => (r.ok ? r.json() : []))
      .then((stations: RadioStation[]) => {
        if (cancelled || !stations.length) return
        playStation(stations[0])
        setFullscreenStation(stations[0])
        // Clean the URL so refresh doesn't re-trigger
        window.history.replaceState({}, '', window.location.pathname)
      })
      .catch(() => { /* link broken, ignore */ })

    return () => { cancelled = true }
  }, [playStation])

  const handleRefreshToDiscovery = (appliedFilters: SearchFilters) => {
    setSearchFilters(appliedFilters)
    setActiveTab('discover')
  }

  const handleCloseFullscreen = () => {
    setFullscreenStation(null)
  }

  const handleMaximizeStation = () => {
    if (currentStation) {
      setFullscreenStation(currentStation)
    }
  }

  const tabs = [
    { id: 'discover' as Tab, icon: Radar, label: 'Discover', shortLabel: 'Radar' },
    { id: 'search' as Tab, icon: Search, label: 'Filter', shortLabel: 'Filter' },
    { id: 'saved' as Tab, icon: Bookmark, label: 'Saved', shortLabel: 'Saved' },
    { id: 'map' as Tab, icon: MapPin, label: 'Map', shortLabel: 'Map' },
    { id: 'about' as Tab, icon: Info, label: 'About', shortLabel: 'About' },
  ]

  return (
    <div className="min-h-screen bg-black text-vdu-green font-mono">
      <header className="border-b border-vdu-green/20 p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 border border-vdu-green flex items-center justify-center text-xs sm:text-sm font-bold">
            U
          </div>
          <div>
            <h1 className="text-sm sm:text-lg font-bold glow">UNHEARD RADIO</h1>
            <p className="text-xs sm:text-sm text-vdu-green-dim">
              Stations live on air: {stats ? stats.stations.toLocaleString() : '…'}
            </p>
          </div>
        </div>
      </header>

      <nav className="border-b border-vdu-green/20 overflow-x-auto">
        <div className="flex min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-r border-vdu-green/20 transition-colors font-mono text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-vdu-green/10 text-vdu-green glow'
                    : 'text-vdu-green-dim hover:text-vdu-green'
                }`}
                title={tab.label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)]">
        {activeTab === 'search' && (
          <div className="w-full lg:w-80 border-r border-vdu-green/20 bg-black/50">
            <SearchSidebar
              onFiltersChange={setSearchFilters}
              onRefreshToDiscovery={handleRefreshToDiscovery}
              totalStations={stats?.stations ?? 0}
            />
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'discover' && <DiscoveryList filters={searchFilters} />}
          {activeTab === 'saved' && <BookmarkList />}
          {activeTab === 'map' && <StationMap />}
          {activeTab === 'search' && <DiscoveryList filters={searchFilters} />}
          {activeTab === 'about' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4 glow">UNHEARD RADIO</h1>
                  <p className="text-xl text-vdu-green-dim mb-6">
                    your portal to the strange side of sound
                  </p>
                </div>

                <div className="space-y-6">
                  <p className="text-lg leading-relaxed">
                    Welcome to the underground. While everyone else feeds you the same popular frequencies,
                    we dig deeper into the weird, wonderful, and completely overlooked corners of global radio.
                  </p>

                  <p className="leading-relaxed">
                    Our reverse-algorithm doesn&apos;t chase listeners—it finds the stations nobody else bothers with.
                    The glitchy transmissions. The ghost signals. The offbeat gems broadcasting to empty rooms
                    at 3 AM.
                  </p>

                  <p className="leading-relaxed">
                    This is anti-algorithm radio. Always live. Never normal.
                  </p>

                  <p className="leading-relaxed">
                    Every station here is real, broadcasting right now from some forgotten corner of the world.
                    No playlists. No recommendations. Just pure, unfiltered discovery of sounds you never
                    knew existed.
                  </p>
                </div>

                <div className="border-t border-vdu-green/20 pt-6 mt-8">
                  <div className="text-sm text-vdu-green-dim space-y-2">
                    <p>Built by Z13labs</p>
                    <p>Contact: hello@z13labs.com</p>
                    <a href="/privacy" className="block text-vdu-green hover:text-vdu-green-dim underline">
                      Privacy Policy
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {currentStation && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <NowPlayingBar onMaximize={handleMaximizeStation} />
        </div>
      )}

      {fullscreenStation && (
        <FullscreenStation station={fullscreenStation} onClose={handleCloseFullscreen} />
      )}
    </div>
  )
}
