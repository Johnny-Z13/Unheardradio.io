import { RadioStation, Country, Genre, SearchFilters } from "@/types/radio";

export async function fetchStations(filters: SearchFilters = {}): Promise<RadioStation[]> {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.country) params.append('country', filters.country);
  if (filters.genre) params.append('genre', filters.genre);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());
  
  const response = await fetch(`/api/stations?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch stations');
  }
  
  return response.json();
}

export async function fetchCountries(): Promise<Country[]> {
  const response = await fetch('/api/countries');
  if (!response.ok) {
    throw new Error('Failed to fetch countries');
  }
  
  return response.json();
}

export async function fetchGenres(): Promise<Genre[]> {
  const response = await fetch('/api/genres');
  if (!response.ok) {
    throw new Error('Failed to fetch genres');
  }
  
  return response.json();
}

export async function trackStationClick(stationUuid: string): Promise<void> {
  try {
    await fetch(`/api/stations/${stationUuid}/click`, {
      method: 'POST',
    });
  } catch (error) {
    console.warn('Failed to track station click:', error);
  }
}

export function getObscurityBadge(station: RadioStation): { text: string; color: string } {
  const clicks = station.clickcount || 0;
  
  if (clicks === 0) {
    return { text: 'PHANTOM', color: 'signal-blue' };
  } else if (clicks < 5) {
    return { text: 'ULTRA RARE', color: 'crt-green' };
  } else if (clicks < 50) {
    return { text: 'RARE', color: 'crt-green' };
  } else if (clicks < 500) {
    return { text: 'HIDDEN GEM', color: 'tape-orange' };
  } else {
    return { text: 'DISCOVERED', color: 'amber' };
  }
}

export function generateStationDescription(station: RadioStation): string {
  const descriptions = [
    "Whispers from the digital void...",
    "Echoes of forgotten frequencies...",
    "Static-wrapped melodies drift through time...",
    "Lost signals seeking distant ears...",
    "Analog warmth in a digital wasteland...",
    "Transmission from the edge of silence...",
    "Ghost frequencies haunt the airwaves...",
    "Distant voices through the static...",
    "Underground currents of sound...",
    "Rare transmissions from remote locations...",
  ];
  
  // Use station UUID as seed for consistent descriptions
  const seed = station.stationuuid.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return descriptions[Math.abs(seed) % descriptions.length];
}
