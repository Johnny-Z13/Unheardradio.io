'use client'

import { useState, useEffect } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { RadioStation } from '@/types/radio';

interface StationMapProps {
  onStationSelect?: (station: RadioStation) => void;
}

export function StationMap({ onStationSelect }: StationMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96 bg-black/50">
        <div className="flex items-center gap-2 text-vdu-green">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 bg-black/50 flex flex-col items-center justify-center text-vdu-green">
      <MapPin className="w-12 h-12 mb-4" />
      <h3 className="text-lg font-bold mb-2">Station Map</h3>
      <p className="text-sm text-vdu-green-dim text-center max-w-md">
        Interactive map showing radio stations by location. 
        This feature will be enhanced in the v0 deployment.
      </p>
    </div>
  );
}