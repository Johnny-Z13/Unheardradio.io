import { useState, useEffect } from 'react';
import { X, Minimize2, Volume2, Share2, Bookmark, Radio, Signal, Globe, Clock, Users, Headphones } from 'lucide-react';
import { RadioStation } from '@/types/radio';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { getObscurityBadge, generateStationDescription, getTimeOnAir, getStationPopularity, getStreamQuality } from '@/lib/radio-api';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';

interface FullscreenStationProps {
  station: RadioStation;
  onClose: () => void;
}

export function FullscreenStation({ station, onClose }: FullscreenStationProps) {
  const {
    currentStation,
    isPlaying,
    volume,
    setVolume,
    isLoading,
    error
  } = useAudioStore();
  
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { toast } = useToast();
  const [showVolumeViz, setShowVolumeViz] = useState(true);

  const isCurrentStation = currentStation?.stationuuid === station.stationuuid;
  const isCurrentlyPlaying = isCurrentStation && isPlaying;
  
  const obscurityBadge = getObscurityBadge(station);
  const description = generateStationDescription(station);
  const timeOnAir = getTimeOnAir(station);
  const popularity = getStationPopularity(station);
  const streamQuality = getStreamQuality(station);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBookmark = () => {
    toggleBookmark(station);
    toast({
      title: isBookmarked(station.stationuuid) ? "Bookmark removed" : "Station bookmarked",
      description: station.name,
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}?station=${station.stationuuid}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Signal Drift - ${station.name}`,
          text: `Check out this obscure radio station: ${station.name}`,
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied",
          description: "Station link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Failed to copy link",
          description: "Unable to copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-radio-black z-50 overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'grid-move 20s linear infinite'
          }}
        />
      </div>

      {/* Scanlines effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full opacity-5" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.3) 2px, rgba(0, 255, 0, 0.3) 4px)'
        }} />
      </div>

      {/* Top bar with controls */}
      <div className="relative z-10 flex items-center justify-between p-6 border-b border-vdu-green-dim">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-vdu-green text-radio-black rounded-lg flex items-center justify-center font-black text-2xl">
            S
          </div>
          <div>
            <h1 className="text-2xl font-black text-vdu-green tracking-tight">SIGNAL DRIFT</h1>
            <p className="text-sm text-muted font-medium">Fullscreen Mode</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowVolumeViz(!showVolumeViz)}
            className="px-4 py-2 bg-vdu-green-dim text-radio-black rounded-lg font-bold text-sm hover:bg-vdu-green transition-colors"
          >
            {showVolumeViz ? 'HIDE VIZ' : 'SHOW VIZ'}
          </button>
          <button
            onClick={onClose}
            className="w-12 h-12 bg-radio-dark border-2 border-vdu-green-dim text-vdu-green hover:border-vdu-green hover:text-vdu-green-bright rounded-lg flex items-center justify-center transition-colors"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
          <button
            onClick={onClose}
            className="w-12 h-12 bg-radio-dark border-2 border-vdu-green-dim text-vdu-green hover:border-vdu-green hover:text-vdu-green-bright rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Station info header */}
          <div className="text-center mb-12">
            <h2 className="text-6xl md:text-8xl font-black text-vdu-green tracking-tight mb-4 uppercase">
              {station.name}
            </h2>
            <p className="text-2xl md:text-3xl text-muted font-medium mb-6">
              Broadcasting from {station.country}
            </p>
            <p className="text-xl text-vdu-green-dim font-medium max-w-2xl mx-auto mb-8">
              {description}
            </p>
            
            {/* Status indicators */}
            <div className="flex items-center justify-center space-x-6 mb-8">
              {isCurrentStation && (
                <div className="inline-flex items-center space-x-3 px-6 py-3 bg-accent-yellow text-radio-black rounded-full text-lg font-black">
                  <div className="w-3 h-3 bg-radio-black rounded-full animate-pulse" />
                  <span>NOW PLAYING</span>
                </div>
              )}
              <div className={`px-6 py-3 rounded-full text-lg font-black text-radio-black ${
                obscurityBadge.color === 'signal-blue' ? 'bg-vdu-green-bright' :
                obscurityBadge.color === 'crt-green' ? 'bg-vdu-green' :
                obscurityBadge.color === 'tape-orange' ? 'bg-accent-yellow' :
                'bg-vdu-green-dim'
              }`}>
                {obscurityBadge.text}
              </div>
            </div>
          </div>

          {/* Animated volume visualization */}
          {showVolumeViz && (
            <div className="mb-12">
              <div className="flex items-center justify-center space-x-2 h-32 mb-8">
                {Array.from({ length: 60 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 rounded-full ${
                      isCurrentlyPlaying
                        ? i % 4 === 0
                          ? 'bg-vdu-green-bright animate-pulse'
                          : i % 3 === 0
                          ? 'bg-vdu-green animate-pulse'
                          : 'bg-vdu-green-dim animate-pulse'
                        : 'bg-radio-dark opacity-50'
                    }`}
                    style={{
                      height: `${20 + Math.sin((i + Date.now() / 100) * 0.1) * 60 + volume * 40}%`,
                      animationDelay: `${i * 0.03}s`,
                      animationDuration: isCurrentlyPlaying ? `${0.3 + Math.random() * 0.4}s` : '1s',
                    }}
                  />
                ))}
              </div>
              
              {/* Volume control */}
              <div className="flex items-center justify-center space-x-6 mb-8">
                <Volume2 className="w-8 h-8 text-vdu-green" />
                <div className="w-96">
                  <Slider
                    value={[volume * 100]}
                    onValueChange={(value) => setVolume(value[0] / 100)}
                    max={100}
                    step={1}
                    className="slider-fullscreen"
                  />
                </div>
                <span className="text-2xl font-bold text-vdu-green min-w-16 text-center">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Station metadata grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Location Info */}
            <div className="bg-radio-dark rounded-2xl p-6 border border-vdu-green-dim">
              <div className="flex items-center space-x-3 mb-4">
                <Globe className="w-8 h-8 text-vdu-green" />
                <h3 className="text-xl font-black text-vdu-green">LOCATION</h3>
              </div>
              <p className="text-lg text-muted mb-2">
                {station.state && station.state !== station.country 
                  ? `${station.state}, ${station.country}`
                  : station.country}
              </p>
              {station.geo_lat && station.geo_long && (
                <p className="text-sm text-vdu-green-dim">
                  📍 {station.geo_lat.toFixed(4)}°, {station.geo_long.toFixed(4)}°
                </p>
              )}
              <p className="text-sm text-muted mt-2">
                Language: {station.language || 'Unknown'}
              </p>
            </div>

            {/* Technical Details */}
            <div className="bg-radio-dark rounded-2xl p-6 border border-vdu-green-dim">
              <div className="flex items-center space-x-3 mb-4">
                <Signal className="w-8 h-8 text-vdu-green" />
                <h3 className="text-xl font-black text-vdu-green">TECHNICAL</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-vdu-green-dim font-bold">Quality:</span>
                  <span className={`ml-2 text-lg font-bold text-${streamQuality.color}`}>
                    {streamQuality.quality}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-vdu-green-dim font-bold">Bitrate:</span>
                  <span className="ml-2 text-lg text-muted">
                    {station.bitrate ? `${station.bitrate} KBPS` : 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-vdu-green-dim font-bold">Codec:</span>
                  <span className="ml-2 text-lg text-muted">{station.codec || 'Unknown'}</span>
                </div>
                {station.hls === 1 && (
                  <div className="text-sm text-vdu-green">✓ HLS STREAM</div>
                )}
                {station.ssl_error === 0 && (
                  <div className="text-sm text-vdu-green">🔒 SECURE CONNECTION</div>
                )}
              </div>
            </div>

            {/* Activity Stats */}
            <div className="bg-radio-dark rounded-2xl p-6 border border-vdu-green-dim">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-8 h-8 text-vdu-green" />
                <h3 className="text-xl font-black text-vdu-green">ACTIVITY</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-vdu-green-dim font-bold">Listeners:</span>
                  <span className="ml-2 text-lg text-muted">{station.clickcount || 0}</span>
                </div>
                <div>
                  <span className="text-sm text-vdu-green-dim font-bold">Popularity:</span>
                  <span className="ml-2 text-lg text-muted">{popularity}</span>
                </div>
                <div>
                  <span className="text-sm text-vdu-green-dim font-bold">On Air:</span>
                  <span className="ml-2 text-lg text-muted">{timeOnAir}</span>
                </div>
                {station.votes > 0 && (
                  <div>
                    <span className="text-sm text-vdu-green-dim font-bold">Votes:</span>
                    <span className="ml-2 text-lg text-muted">★ {station.votes}</span>
                  </div>
                )}
                {station.clicktrend !== 0 && (
                  <div className={`text-sm ${station.clicktrend > 0 ? 'text-vdu-green' : 'text-accent-yellow'}`}>
                    {station.clicktrend > 0 ? '📈 Trending up' : '📉 Trending down'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-3 px-8 py-4 rounded-2xl border-2 font-bold text-lg transition-all ${
                isBookmarked(station.stationuuid)
                  ? 'border-vdu-green bg-vdu-green text-radio-black'
                  : 'border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green'
              }`}
            >
              <Bookmark className={`w-6 h-6 ${isBookmarked(station.stationuuid) ? 'fill-current' : ''}`} />
              <span>{isBookmarked(station.stationuuid) ? 'BOOKMARKED' : 'BOOKMARK'}</span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center space-x-3 px-8 py-4 rounded-2xl border-2 border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-all font-bold text-lg"
            >
              <Share2 className="w-6 h-6" />
              <span>SHARE STATION</span>
            </button>

            {station.homepage && (
              <a
                href={station.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 px-8 py-4 rounded-2xl border-2 border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-all font-bold text-lg"
              >
                <Globe className="w-6 h-6" />
                <span>VISIT WEBSITE</span>
              </a>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="mt-8 p-6 bg-radio-dark border-2 border-accent-yellow rounded-2xl text-center">
              <p className="text-lg text-accent-yellow font-bold">⚠ {error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}