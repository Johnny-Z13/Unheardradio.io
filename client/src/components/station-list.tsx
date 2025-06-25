import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shuffle, Loader2 } from 'lucide-react';
import { RadioStation, SearchFilters } from '@/types/radio';
import { fetchStations } from '@/lib/radio-api';
import { StationCard } from './station-card';
import { Button } from '@/components/ui/button';

interface StationListProps {
  filters: SearchFilters;
}

export function StationList({ filters }: StationListProps) {
  const [page, setPage] = useState(0);
  const limit = 20;
  
  const {
    data: stations = [],
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['/api/stations', { ...filters, limit, offset: page * limit }],
    queryFn: () => fetchStations({ ...filters, limit, offset: page * limit }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleRandomDrift = () => {
    if (stations.length > 0) {
      const randomIndex = Math.floor(Math.random() * stations.length);
      const randomStation = stations[randomIndex];
      // Scroll to the random station
      const element = document.querySelector(`[data-station-id="${randomStation.stationuuid}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (isLoading && page === 0) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-crt-green mx-auto mb-4" />
          <p className="text-crt-green">Scanning airwaves...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-2">Signal Lost</div>
          <p className="text-gray-400">
            {error instanceof Error ? error.message : 'Failed to load stations'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-crt-green font-serif">Ultra-Obscure Transmissions</h2>
          <p className="text-sm text-gray-400 mt-1">
            Sorted by reverse popularity • {stations.length} stations found
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRandomDrift}
            variant="outline"
            size="sm"
            className="border-crt-dim text-crt-green hover:bg-crt-green hover:text-radio-black"
          >
            <Shuffle className="w-4 h-4 mr-1" />
            Random Drift
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {stations.map((station: RadioStation) => (
          <div key={station.stationuuid} data-station-id={station.stationuuid}>
            <StationCard station={station} />
          </div>
        ))}
      </div>

      {stations.length > 0 && (
        <div className="text-center py-8">
          <Button
            onClick={handleLoadMore}
            disabled={isFetching}
            variant="outline"
            className="px-6 py-3 border-crt-dim text-crt-green hover:border-crt-green hover:bg-crt-green hover:text-radio-black relative group"
          >
            {isFetching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Scanning Airwaves...
              </>
            ) : (
              <>
                <span className="relative z-10">Scan for More Signals</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-crt-green to-transparent opacity-0 group-hover:opacity-20 animate-scan"></div>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
