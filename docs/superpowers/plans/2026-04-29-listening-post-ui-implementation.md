# Listening Post UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp the Unheard Radio UI from generic "VDU green" to a focused listening-post design language — clinical data density, custom SVG icons, oscilloscope/waterfall visualizers, console-banner header, operational-verb nav — without changing functionality.

**Architecture:** All visual changes; no data layer or routing changes. Build the foundation files first (CSS tokens, icons, station-format helpers), then refactor each surface (card → strip → header/nav → visualizer → fullscreen → share menu → sidebar). The visualizer is the highest-risk piece and gets its own three-task sequence.

**Tech Stack:** Next.js 15, React 18, TypeScript, Tailwind, shadcn/ui (kept), Zustand, TanStack Query. No new runtime deps.

**Spec:** `docs/superpowers/specs/2026-04-29-listening-post-ui-design.md`

---

## File Structure

**New files:**
- `components/icons.tsx` — 16 SVG icon components (Play, Pause, Stop, Log, LogOn, Send, Inspect, Scan, Discover, Filter, Map, Info, Vol, Close, Search, Rescan)
- `lib/station-format.ts` — derives `BAND`, `ID`, `COORDS`, `ORIGIN`, `RX`, `RATE`, `UPTIME` strings from `RadioStation`

**Modified:**
- `app/globals.css` — color tokens, VT323 import, scanline overlay, `.phosphor` utility
- `app/page.tsx` — header (Option B stamp), nav (operational verbs)
- `components/station-card.tsx` — full restyle to log-entry layout
- `components/now-playing-bar.tsx` — three-column grid + trace + dBFS readout
- `components/audio-visualizer.tsx` — full rewrite, two modes (`trace` / `waterfall`)
- `components/fullscreen-station.tsx` — restyled chrome + waterfall visualizer
- `components/share-menu.tsx` — restyled popover, swap to new icons
- `components/search-sidebar.tsx` — restyled headers + icon swap

**Deleted:** none

**Out of scope per spec:** map view, OG image, tab transitions.

---

## Approach

Test plan: this codebase has no test runner. We verify each task by:
1. **Build check** — `npm run build` must pass after every task that touches TypeScript.
2. **Visual check** — `npm run dev`, then open `http://localhost:3000`, navigate to the relevant surface, confirm appearance matches spec at desktop AND mobile-narrow widths (use Chrome DevTools device toolbar at 375×812).
3. **Behavior check** — explicit click-through scenarios listed per task.

Each task ends with a build check + visual/behavior check + commit.

---

## Task 1: Color tokens, fonts, scanlines

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Read current globals.css**

Run: `cat app/globals.css`
Expected: see existing `--vdu-green`, `--vdu-green-dim`, etc., plus `JetBrains Mono` Google Font import.

- [ ] **Step 2: Replace globals.css with new token set**

Replace the entire file contents with:

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=VT323&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Listening Post tokens (HSL channels for shadcn compatibility) */
  --background: 0 0% 2%;
  --foreground: 120 80% 42%;
  --card: 0 0% 4%;
  --card-foreground: 120 80% 42%;
  --popover: 0 0% 4%;
  --popover-foreground: 120 80% 42%;
  --primary: 120 100% 58%;
  --primary-foreground: 0 0% 0%;
  --secondary: 0 0% 5%;
  --secondary-foreground: 120 80% 42%;
  --muted: 0 0% 8%;
  --muted-foreground: 120 65% 28%;
  --accent: 180 100% 70%;
  --accent-foreground: 0 0% 0%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 120 40% 14%;
  --input: 0 0% 5%;
  --ring: 120 100% 58%;
  --radius: 0;

  /* App-specific (existing names retained for Tailwind tokens) */
  --vdu-green: 120 80% 42%;
  --vdu-green-dim: 120 65% 28%;
  --vdu-green-bright: 120 100% 58%;
  --vdu-green-faint: 120 40% 14%;
  --vdu-glow: 120 100% 58%;
  --radio-black: 0 0% 2%;
  --radio-dark: 0 0% 4%;
  --radio-panel: 0 0% 5%;
  --accent-cyan: 180 100% 70%;
  --text-muted: 120 65% 28%;
  --hairline: 120 60% 30%;
}

* {
  border-color: hsl(var(--border));
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: 'JetBrains Mono', monospace;
  background-image: linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.18) 50%);
  background-size: 100% 3px;
}

.font-display {
  font-family: 'VT323', monospace;
}

.phosphor {
  text-shadow: 0 0 5px hsla(120, 100%, 55%, 0.4);
}

.glow {
  text-shadow: 0 0 8px hsl(var(--vdu-glow));
}

.text-vdu-green { color: hsl(var(--vdu-green)); }
.text-vdu-green-dim { color: hsl(var(--vdu-green-dim)); }
.text-vdu-green-bright { color: hsl(var(--vdu-green-bright)); }
.bg-vdu-green { background-color: hsl(var(--vdu-green)); }
.bg-radio-dark { background-color: hsl(var(--radio-dark)); }
.bg-radio-panel { background-color: hsl(var(--radio-panel)); }
.border-vdu-green { border-color: hsl(var(--vdu-green)); }
.border-vdu-green-dim { border-color: hsl(var(--vdu-green-dim)); }
.border-hairline { border-color: hsla(var(--hairline), 0.35); }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: hsl(var(--background)); }
::-webkit-scrollbar-thumb { background: hsl(var(--vdu-green-dim)); }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--vdu-green)); }
```

- [ ] **Step 3: Update tailwind.config.ts to add new tokens**

Add these inside `theme.extend.colors`, after the existing `accent-cyan` line:

```ts
        "vdu-green-faint": "hsl(var(--vdu-green-faint))",
        "radio-panel": "hsl(var(--radio-panel))",
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: build succeeds with no TS errors.

- [ ] **Step 5: Visual check**

Run: `npm run dev` then open `http://localhost:3000`. The page should still render but feel slightly darker (background `#050807` instead of pure black) and you should see faint horizontal scanlines on every other pixel row. Greens should look slightly muted (the chrome shifts from saturated to dimmer on inactive elements).

- [ ] **Step 6: Commit**

```bash
git add app/globals.css tailwind.config.ts
git commit -m "Adopt Listening Post color tokens, VT323 font, scanline overlay"
```

---

## Task 2: Icon kit

**Files:**
- Create: `components/icons.tsx`

- [ ] **Step 1: Create icons.tsx with all 16 glyphs**

Write this file:

```tsx
type IconProps = { size?: number; className?: string }
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 14 14' })

export function Play({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <polygon points="3,2 11,7 3,12" fill="currentColor" />
    </svg>
  )
}

export function Pause({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <rect x="3" y="2" width="2.5" height="10" fill="currentColor" />
      <rect x="8.5" y="2" width="2.5" height="10" fill="currentColor" />
    </svg>
  )
}

export function Stop({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="9" height="9" fill="currentColor" />
    </svg>
  )
}

export function Log({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter">
      <path d="M3 1.5 L3 12.5 L7 9.5 L11 12.5 L11 1.5 Z" />
    </svg>
  )
}

export function LogOn({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter">
      <path d="M3 1.5 L3 12.5 L7 9.5 L11 12.5 L11 1.5 Z" />
    </svg>
  )
}

export function Send({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <circle cx="3" cy="7" r="1.6" fill="currentColor" />
      <circle cx="11" cy="3" r="1.6" fill="currentColor" />
      <circle cx="11" cy="11" r="1.6" fill="currentColor" />
      <line x1="4.3" y1="6.3" x2="9.7" y2="3.7" />
      <line x1="4.3" y1="7.7" x2="9.7" y2="10.3" />
    </svg>
  )
}

export function Inspect({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <polyline points="2,5 2,2 5,2" />
      <polyline points="9,2 12,2 12,5" />
      <polyline points="12,9 12,12 9,12" />
      <polyline points="5,12 2,12 2,9" />
    </svg>
  )
}

export function Scan({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <path d="M1.5 3.5 L4 3.5 L7 10.5 L9.5 10.5" />
      <path d="M1.5 10.5 L4 10.5 L7 3.5 L9.5 3.5" />
      <polyline points="8,2 9.5,3.5 8,5" />
      <polyline points="8,9 9.5,10.5 8,12" />
    </svg>
  )
}

export function Discover({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5.5" />
      <circle cx="7" cy="7" r="2.5" />
      <line x1="7" y1="7" x2="11" y2="3" />
    </svg>
  )
}

export function Filter({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter">
      <polygon points="1.5,2 12.5,2 8,7.5 8,12 6,11 6,7.5" />
    </svg>
  )
}

export function MapPin({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="5.5" r="2" />
      <path d="M7 1.5 C 4.5 1.5, 3 3.5, 3 5.5 C 3 8, 7 12.5, 7 12.5 C 7 12.5, 11 8, 11 5.5 C 11 3.5, 9.5 1.5, 7 1.5 Z" />
    </svg>
  )
}

export function Info({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5.5" />
      <line x1="7" y1="6" x2="7" y2="10" />
      <circle cx="7" cy="4" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function Vol({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <polygon points="2,5 5,5 8,2 8,12 5,9 2,9" fill="currentColor" stroke="none" />
      <path d="M10 5 Q 11.5 7, 10 9" />
    </svg>
  )
}

export function Close({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <line x1="3" y1="3" x2="11" y2="11" />
      <line x1="11" y1="3" x2="3" y2="11" />
    </svg>
  )
}

export function Search({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <circle cx="6" cy="6" r="3.8" />
      <line x1="9" y1="9" x2="12" y2="12" />
    </svg>
  )
}

export function Rescan({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <path d="M2 7 A 5 5 0 1 1 7 12" />
      <polyline points="5,12 7,12 7,10" />
    </svg>
  )
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/icons.tsx
git commit -m "Add custom SVG icon kit (16 glyphs) for Listening Post UI"
```

---

## Task 3: Station data formatter

**Files:**
- Create: `lib/station-format.ts`

- [ ] **Step 1: Create the formatter**

Write this file:

```ts
import type { RadioStation } from '@/types/radio'

export function getBand(station: RadioStation): 'FM' | 'AM' | 'SW' | 'WEB' {
  const haystack = `${station.name} ${station.tags || ''}`.toLowerCase()
  if (/\bshortwave\b|\bsw\b/.test(haystack)) return 'SW'
  if (/\bam\b\s*\d{3,4}|\d{3,4}\s*\bam\b/.test(haystack)) return 'AM'
  if (/\bfm\b|f\.m\./.test(haystack)) return 'FM'
  return 'WEB'
}

export function getStationId(station: RadioStation): string {
  if (!station.stationuuid) return '----'
  return station.stationuuid.replace(/-/g, '').slice(0, 4).toUpperCase()
}

export function getCoords(station: RadioStation): string {
  const lat = station.geo_lat
  const lon = station.geo_long
  if (lat == null || lon == null || (lat === 0 && lon === 0)) return 'COORDS UNKNOWN'
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(1)}°${ns} ${Math.abs(lon).toFixed(1)}°${ew}`
}

const COUNTRY_SHORT: Record<string, string> = {
  'United States of America': 'USA',
  'United States': 'USA',
  'United Kingdom': 'UK',
  'United Kingdom of Great Britain and Northern Ireland': 'UK',
  'Russian Federation': 'Russia',
}

export function getOrigin(station: RadioStation): string {
  const cc = station.countrycode?.toUpperCase() || ''
  const name = COUNTRY_SHORT[station.country] || station.country || ''
  if (cc && name) return `${cc} / ${name.toUpperCase()}`
  if (name) return name.toUpperCase()
  return '— / UNKNOWN'
}

export function getRate(station: RadioStation): string {
  if (!station.bitrate) return '—'
  const codec = (station.codec || 'MP3').toUpperCase()
  return `${station.bitrate}k ${codec}`
}

export function getUptime(station: RadioStation): string {
  if (!station.lastchangetime) return '—'
  const last = new Date(station.lastchangetime).getTime()
  if (Number.isNaN(last)) return '—'
  const days = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24))
  if (days < 1) return '<1d'
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  const years = Math.floor(days / 365)
  const remDays = days - years * 365
  return remDays > 0 ? `${years}y ${remDays}d` : `${years}y`
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Quick smoke test in browser**

Run: `npm run dev`
Open browser console at `http://localhost:3000` and paste:

```js
fetch('/api/stations?limit=3').then(r=>r.json()).then(s=>console.log(s[0]))
```

Confirm the returned object has `stationuuid`, `name`, `country`, `bitrate`, `lastchangetime` — these are the fields the formatter consumes.

- [ ] **Step 4: Commit**

```bash
git add lib/station-format.ts
git commit -m "Add station-format helpers (BAND/ID/COORDS/ORIGIN/RATE/UPTIME)"
```

---

## Task 4: Station card restyle

**Files:**
- Modify: `components/station-card.tsx` (full replacement)

- [ ] **Step 1: Replace station-card.tsx**

Overwrite the entire file with:

```tsx
import { RadioStation } from '@/types/radio';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { ShareMenu } from './share-menu';
import { Play, Stop, Log, LogOn, Inspect, Send } from './icons';
import { getBand, getStationId, getCoords, getOrigin, getRate, getUptime } from '@/lib/station-format';

interface StationCardProps {
  station: RadioStation;
  onMaximize?: () => void;
}

export function StationCard({ station, onMaximize }: StationCardProps) {
  const { playStation, currentStation, isPlaying, isLoading } = useAudioStore();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const isCurrent = currentStation?.stationuuid === station.stationuuid;
  const isLive = isCurrent && isPlaying;
  const isBuffering = isCurrent && isLoading;
  const bookmarked = isBookmarked(station.stationuuid);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(station);
  };

  return (
    <div
      className={`bg-radio-dark border border-hairline border-l-2 p-3 sm:p-4 mb-2.5 transition-colors ${
        isCurrent
          ? 'border-l-vdu-green-bright'
          : 'border-l-vdu-green-dim hover:border-l-vdu-green'
      }`}
      style={isCurrent ? {
        background: 'linear-gradient(90deg, hsla(120, 80%, 35%, 0.08) 0%, transparent 60%)',
        boxShadow: 'inset 2px 0 12px hsla(120, 100%, 50%, 0.10)',
      } : undefined}
    >
      {/* Row 1: callsign + top metadata */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <h3 className={`font-bold text-sm sm:text-[15px] uppercase tracking-wide truncate ${isCurrent ? 'text-vdu-green-bright phosphor' : 'text-vdu-green-bright'}`}>
            {station.name}
          </h3>
          {isLive && (
            <span className="inline-flex items-center gap-1.5 border border-accent-cyan/40 bg-accent-cyan/10 px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase text-accent-cyan whitespace-nowrap">
              <span className="w-1.5 h-1.5 bg-accent-cyan animate-pulse" />
              RX&nbsp;ACTIVE
            </span>
          )}
        </div>
        <div className="text-[10px] sm:text-[11px] tracking-[0.08em] uppercase text-vdu-green-dim text-right ml-auto whitespace-nowrap">
          BAND&nbsp;{getBand(station)}
          <span className="opacity-50 px-1.5">·</span>
          ID&nbsp;{getStationId(station)}
          <span className="hidden sm:inline">
            <span className="opacity-50 px-1.5">·</span>
            {getCoords(station)}
          </span>
        </div>
      </div>

      {/* Row 2: play + data + actions */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 items-center">
        <button
          onClick={() => playStation(station)}
          disabled={isBuffering}
          aria-label={isLive ? 'Stop' : 'Tune in'}
          className={`w-9 h-9 sm:w-10 sm:h-10 border flex items-center justify-center transition-colors ${
            isLive
              ? 'bg-vdu-green-bright text-radio-black border-vdu-green-bright'
              : 'border-vdu-green-dim text-vdu-green hover:border-vdu-green-bright hover:text-vdu-green-bright'
          } ${isBuffering ? 'animate-pulse' : ''}`}
          style={isLive ? { boxShadow: '0 0 10px hsla(120,100%,55%,0.4)' } : undefined}
        >
          {isBuffering ? (
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isLive ? (
            <Stop size={14} />
          ) : (
            <Play size={14} />
          )}
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-5 gap-y-0.5 text-[11px] tracking-[0.04em] min-w-0">
          <span className="text-vdu-green-dim uppercase">Origin</span>
          <span className="text-vdu-green-dim uppercase">RX</span>
          <span className="text-vdu-green-dim uppercase hidden sm:inline">Rate</span>
          <span className="text-vdu-green-dim uppercase hidden sm:inline">Uptime</span>
          <span className="text-vdu-green truncate">{getOrigin(station)}</span>
          <span className="text-vdu-green">{station.clickcount || 0}</span>
          <span className="text-vdu-green hidden sm:inline">{getRate(station)}</span>
          <span className="text-vdu-green hidden sm:inline">{getUptime(station)}</span>
        </div>

        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={handleBookmark}
            aria-label={bookmarked ? 'Remove from log' : 'Log contact'}
            className={`w-7 h-7 border flex items-center justify-center transition-colors ${
              bookmarked
                ? 'border-vdu-green text-vdu-green-bright bg-vdu-green/10'
                : 'border-hairline text-vdu-green-dim hover:text-vdu-green hover:border-vdu-green-dim'
            }`}
          >
            {bookmarked ? <LogOn size={12} /> : <Log size={12} />}
          </button>
          <ShareMenu
            station={station}
            iconClassName="w-7 h-7 border border-hairline text-vdu-green-dim hover:text-vdu-green hover:border-vdu-green-dim flex items-center justify-center"
            trigger={<Send size={12} />}
          />
          {onMaximize && (
            <button
              onClick={onMaximize}
              aria-label="Inspect station"
              className="w-7 h-7 border border-hairline text-vdu-green-dim hover:text-vdu-green hover:border-vdu-green-dim flex items-center justify-center transition-colors"
            >
              <Inspect size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Visual check**

Run: `npm run dev`. Open `http://localhost:3000`.

- Discover tab should show stations as log-entry rows (left border, top metadata strip, data block).
- Click play on any station: that row's left border becomes bright green, callsign glows, and an `RX ACTIVE` cyan badge appears next to the name.
- Resize to mobile (375px wide via DevTools): coords should hide from the top metadata, and the data block should collapse to 2 columns (Origin + RX visible, Rate + Uptime hidden).
- Hover other stations: left border lightens.

- [ ] **Step 4: Commit**

```bash
git add components/station-card.tsx
git commit -m "Restyle station card to log-entry layout with new icons"
```

---

## Task 5: Now-playing strip restyle

**Files:**
- Modify: `components/now-playing-bar.tsx` (full replacement)

- [ ] **Step 1: Replace now-playing-bar.tsx**

Overwrite the entire file with:

```tsx
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { AudioVisualizer } from '@/components/audio-visualizer';
import { ShareMenu } from './share-menu';
import { Stop, Play, Log, LogOn, Send, Inspect } from './icons';
import { getBand, getStationId, getCoords } from '@/lib/station-format';

export function NowPlayingBar({ onMaximize }: { onMaximize?: () => void }) {
  const { currentStation, isPlaying, togglePlay, error } = useAudioStore();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  if (!currentStation) return null;
  const bookmarked = isBookmarked(currentStation.stationuuid);

  return (
    <div
      className="border-t border-vdu-green-dim bg-radio-panel px-3 sm:px-4 py-2 sm:py-3 grid items-center gap-3 sm:gap-4"
      style={{
        gridTemplateColumns: 'minmax(0, 1fr) auto auto',
        boxShadow: '0 -4px 20px hsla(120, 100%, 40%, 0.08)',
      }}
    >
      {/* Info + trace stack */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] tracking-[0.08em] uppercase text-vdu-green-dim mb-0.5">
          <span>► RX</span>
          <span className="text-accent-cyan">ID&nbsp;{getStationId(currentStation)}</span>
          <span className="hidden sm:inline">·&nbsp;BAND&nbsp;{getBand(currentStation)}</span>
          <span className="hidden md:inline">·&nbsp;{getCoords(currentStation)}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-accent-cyan">
            <span className={`w-1.5 h-1.5 bg-accent-cyan ${isPlaying ? 'animate-pulse' : 'opacity-30'}`} />
            {isPlaying ? 'LIVE' : 'PAUSED'}
          </span>
        </div>
        <div className="text-vdu-green-bright font-bold text-[13px] sm:text-sm uppercase tracking-wide truncate phosphor">
          {currentStation.name}
        </div>
        {error && (
          <p className="text-[10px] text-accent-cyan truncate mt-0.5">⚠ {error}</p>
        )}
      </div>

      {/* Visualizer (hidden on the smallest screens to keep the strip glanceable) */}
      <div className="hidden sm:block w-[180px] md:w-[260px] lg:w-[300px]">
        <AudioVisualizer mode="trace" height={28} />
      </div>

      {/* Controls */}
      <div className="flex gap-1.5">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Stop' : 'Play'}
          className="w-8 h-8 bg-vdu-green-bright text-radio-black border border-vdu-green-bright flex items-center justify-center"
          style={{ boxShadow: '0 0 8px hsla(120,100%,55%,0.4)' }}
        >
          {isPlaying ? <Stop size={12} /> : <Play size={12} />}
        </button>
        <button
          onClick={() => toggleBookmark(currentStation)}
          aria-label={bookmarked ? 'Remove from log' : 'Log contact'}
          className={`w-8 h-8 border flex items-center justify-center transition-colors ${
            bookmarked
              ? 'border-vdu-green text-vdu-green-bright bg-vdu-green/10'
              : 'border-vdu-green-dim text-vdu-green-dim hover:text-vdu-green hover:border-vdu-green'
          }`}
        >
          {bookmarked ? <LogOn size={12} /> : <Log size={12} />}
        </button>
        <ShareMenu
          station={currentStation}
          iconClassName="w-8 h-8 border border-vdu-green-dim text-vdu-green-dim hover:text-vdu-green hover:border-vdu-green flex items-center justify-center transition-colors"
          trigger={<Send size={12} />}
        />
        {onMaximize && (
          <button
            onClick={onMaximize}
            aria-label="Inspect"
            className="w-8 h-8 border border-vdu-green-dim text-vdu-green-dim hover:text-vdu-green hover:border-vdu-green flex items-center justify-center transition-colors"
          >
            <Inspect size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: build will likely fail because `AudioVisualizer` does not yet accept a `mode` prop. This is expected — Task 6 fixes it. Skip the build until Task 6, just check for syntax errors:

Run: `npx tsc --noEmit components/now-playing-bar.tsx 2>&1 | head -20`
Expected: only the AudioVisualizer mode-prop error. No other errors.

If there are errors unrelated to `mode`, fix the syntax in this file before continuing.

- [ ] **Step 3: Commit (out-of-order — strip first, visualizer next)**

```bash
git add components/now-playing-bar.tsx
git commit -m "Restyle now-playing strip with new chrome and icon kit (visualizer follows)"
```

---

## Task 6: Audio visualizer rewrite — trace + dBFS modes

**Files:**
- Modify: `components/audio-visualizer.tsx` (full replacement)

- [ ] **Step 1: Replace audio-visualizer.tsx**

Overwrite the entire file with:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useAudioStore } from '@/lib/audio-store'

type Mode = 'trace' | 'waterfall' | 'dbfs'

interface AudioVisualizerProps {
  mode?: Mode
  height?: number
  width?: number
}

const SAMPLES = 50

export function AudioVisualizer({ mode = 'trace', height = 28, width }: AudioVisualizerProps) {
  const { isPlaying, currentStation } = useAudioStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const traceRef = useRef<SVGPathElement>(null)
  const trailRef = useRef<SVGPathElement>(null)
  const cursorRef = useRef<SVGLineElement>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const rafRef = useRef<number>()
  const prevPathRef = useRef<string>('')
  const phaseRef = useRef(0)

  const [readout, setReadout] = useState<{ peak: number; avg: number }>({ peak: -60, avg: -60 })

  // Audio graph setup
  useEffect(() => {
    let cancelled = false
    if (!isPlaying || !currentStation || analyserRef.current) return

    const t = setTimeout(() => {
      if (cancelled) return
      try {
        const audio = document.getElementById('main-audio-player') as HTMLAudioElement | null
        if (!audio || !audio.src || audio.paused) return

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        if (ctx.state === 'suspended') ctx.resume()
        const src = ctx.createMediaElementSource(audio)
        const ana = ctx.createAnalyser()
        ana.fftSize = 256
        ana.smoothingTimeConstant = 0.15
        ana.minDecibels = -80
        ana.maxDecibels = -20
        src.connect(ana)
        ana.connect(ctx.destination)
        audioContextRef.current = ctx
        sourceRef.current = src
        analyserRef.current = ana
        dataRef.current = new Uint8Array(new ArrayBuffer(ana.frequencyBinCount))
      } catch {
        // setup failed — animation will use synthetic fallback
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [isPlaying, currentStation])

  // Cleanup on unmount or when stopping
  useEffect(() => {
    if (!isPlaying || !currentStation) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      try { sourceRef.current?.disconnect() } catch { /* ignore */ }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close() } catch { /* ignore */ }
      }
      sourceRef.current = null
      analyserRef.current = null
      audioContextRef.current = null
      dataRef.current = null
      prevPathRef.current = ''
    }
  }, [isPlaying, currentStation])

  // Animation loop
  useEffect(() => {
    const tick = () => {
      const w = svgRef.current?.clientWidth || width || 280
      const h = height
      let bytes: Uint8Array | null = null

      if (analyserRef.current && dataRef.current) {
        analyserRef.current.getByteFrequencyData(dataRef.current)
        bytes = dataRef.current
      }

      if (mode === 'trace') {
        const path = bytes
          ? buildTraceFromBytes(bytes, w, h)
          : buildSyntheticTrace(w, h, phaseRef.current, isPlaying)
        traceRef.current?.setAttribute('d', path)
        trailRef.current?.setAttribute('d', prevPathRef.current)
        prevPathRef.current = path
        phaseRef.current += isPlaying ? 0.06 : 0.015
      } else if (mode === 'dbfs' && bytes) {
        let max = 0
        let sum = 0
        for (let i = 0; i < bytes.length; i++) {
          if (bytes[i] > max) max = bytes[i]
          sum += bytes[i]
        }
        const avg = sum / bytes.length
        // Map 0..255 to roughly -60..0 dBFS
        const peakDb = max === 0 ? -60 : 20 * Math.log10(max / 255)
        const avgDb = avg === 0 ? -60 : 20 * Math.log10(avg / 255)
        setReadout({ peak: peakDb, avg: avgDb })
      } else if (mode === 'waterfall' && canvasRef.current && bytes) {
        drawWaterfall(canvasRef.current, bytes)
      } else if (mode === 'waterfall' && canvasRef.current) {
        drawSyntheticWaterfall(canvasRef.current, phaseRef.current)
        phaseRef.current += isPlaying ? 0.08 : 0.02
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [mode, height, width, isPlaying])

  if (mode === 'dbfs') {
    return (
      <div className="text-[11px] tracking-[0.08em] uppercase text-vdu-green-dim whitespace-nowrap">
        Peak <span className="text-vdu-green-bright">{readout.peak.toFixed(1)}</span> dBFS
        <span className="opacity-50 px-1.5">·</span>
        Avg <span className="text-vdu-green-bright">{readout.avg.toFixed(1)}</span>
      </div>
    )
  }

  if (mode === 'waterfall') {
    return (
      <canvas
        ref={canvasRef}
        width={512}
        height={height}
        className="w-full block"
        style={{ background: 'rgba(0, 18, 0, 0.5)', height }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full border border-hairline overflow-hidden"
      style={{ height, background: 'rgba(0, 18, 0, 0.5)' }}
    >
      <svg ref={svgRef} viewBox={`0 0 600 ${height}`} preserveAspectRatio="none" className="w-full h-full block">
        <line x1="0" y1={height / 2} x2="600" y2={height / 2} stroke="hsl(var(--vdu-green-faint))" strokeWidth="0.5" />
        <line x1="0" y1={height / 4} x2="600" y2={height / 4} stroke="hsl(var(--vdu-green-faint))" strokeWidth="0.5" />
        <line x1="0" y1={(height * 3) / 4} x2="600" y2={(height * 3) / 4} stroke="hsl(var(--vdu-green-faint))" strokeWidth="0.5" />
        <path ref={trailRef} fill="none" stroke="hsl(var(--vdu-green))" strokeWidth="1" opacity="0.25" />
        <path ref={traceRef} fill="none" stroke="hsl(var(--vdu-green-bright))" strokeWidth="1" style={{ filter: 'drop-shadow(0 0 2px hsla(120,100%,60%,0.7))' }} />
        <line ref={cursorRef} x1="600" y1="0" x2="600" y2={height} stroke="hsl(var(--accent-cyan))" strokeWidth="0.8" opacity="0.7" />
      </svg>
    </div>
  )
}

function buildTraceFromBytes(bytes: Uint8Array, width: number, height: number): string {
  const center = height / 2
  const len = SAMPLES
  const step = bytes.length / len
  const parts: string[] = []
  for (let i = 0; i <= len; i++) {
    const x = (i / len) * 600
    const v = bytes[Math.floor(i * step)] || 0
    const norm = (v / 255) - 0.5
    const y = center + norm * height * 0.85
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return parts.join(' ')
}

function buildSyntheticTrace(width: number, height: number, phase: number, active: boolean): string {
  const center = height / 2
  const amp = active ? height * 0.35 : height * 0.05
  const len = SAMPLES
  const parts: string[] = []
  for (let i = 0; i <= len; i++) {
    const x = (i / len) * 600
    const t = phase + i * 0.4
    const y = center
      + Math.sin(t) * amp * 0.5
      + Math.sin(t * 1.7) * amp * 0.25
      + Math.sin(t * 0.3 + i * 0.2) * amp * 0.15
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return parts.join(' ')
}

function drawWaterfall(canvas: HTMLCanvasElement, bytes: Uint8Array) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  // Shift everything down 1px
  const img = ctx.getImageData(0, 0, w, h - 1)
  ctx.putImageData(img, 0, 1)
  // Draw new top row
  const row = ctx.createImageData(w, 1)
  for (let x = 0; x < w; x++) {
    const idx = Math.floor((x / w) * bytes.length)
    const v = bytes[idx] / 255
    const [r, g, b, a] = waterfallColor(v)
    const off = x * 4
    row.data[off] = r
    row.data[off + 1] = g
    row.data[off + 2] = b
    row.data[off + 3] = a
  }
  ctx.putImageData(row, 0, 0)
}

function drawSyntheticWaterfall(canvas: HTMLCanvasElement, phase: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  const img = ctx.getImageData(0, 0, w, h - 1)
  ctx.putImageData(img, 0, 1)
  const row = ctx.createImageData(w, 1)
  for (let x = 0; x < w; x++) {
    const t = phase + x * 0.04
    let v = 0.2 + Math.sin(t) * 0.15 + Math.sin(t * 2.3) * 0.1 + Math.sin(t * 0.31) * 0.1
    v += (Math.random() - 0.5) * 0.05
    v = Math.max(0, Math.min(1, v))
    const [r, g, b, a] = waterfallColor(v)
    const off = x * 4
    row.data[off] = r
    row.data[off + 1] = g
    row.data[off + 2] = b
    row.data[off + 3] = a
  }
  ctx.putImageData(row, 0, 0)
}

function waterfallColor(v: number): [number, number, number, number] {
  // Ramp: faint → dim → green → bright → cyan
  if (v < 0.05) return [0, 0, 0, 0]
  if (v < 0.2) return [10, 50, 10, 180]
  if (v < 0.5) return [20, 130, 30, 210]
  if (v < 0.8) return [40, 230, 60, 230]
  return [80, 255, 200, 240]
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: build succeeds. The `now-playing-bar.tsx` reference to `mode="trace"` should now type-check.

- [ ] **Step 3: Visual check — strip trace**

Run: `npm run dev`. Open `http://localhost:3000`, click play on any station.

- The now-playing strip at the bottom should show: dim metadata line, bright callsign, **center oscilloscope trace** with cyan cursor at right edge, control buttons.
- The trace should react to actual audio (you'll see it move with the music) once playback starts. Until the AudioContext attaches (~400ms after play), it'll show a small synthetic baseline animation.
- At narrow mobile width (<640px), the trace should hide and the strip should still be functional.

- [ ] **Step 4: Commit**

```bash
git add components/audio-visualizer.tsx
git commit -m "Rewrite audio visualizer with trace/waterfall/dbfs modes"
```

---

## Task 7: dBFS readout in strip

**Files:**
- Modify: `components/now-playing-bar.tsx`

- [ ] **Step 1: Add dBFS readout next to the trace**

In `now-playing-bar.tsx`, find the visualizer block:

```tsx
      {/* Visualizer (hidden on the smallest screens to keep the strip glanceable) */}
      <div className="hidden sm:block w-[180px] md:w-[260px] lg:w-[300px]">
        <AudioVisualizer mode="trace" height={28} />
      </div>
```

Replace with:

```tsx
      {/* Visualizer + readout (hidden on the smallest screens) */}
      <div className="hidden sm:flex flex-col gap-1 w-[180px] md:w-[260px] lg:w-[300px]">
        <AudioVisualizer mode="trace" height={24} />
        <div className="hidden md:block">
          <AudioVisualizer mode="dbfs" />
        </div>
      </div>
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Visual check**

`npm run dev`, play a station. At md (≥768px) width, you should see the trace plus a dim text line below it: `PEAK -X.X dBFS · AVG -X.X`. Values change in real time.

- [ ] **Step 4: Commit**

```bash
git add components/now-playing-bar.tsx
git commit -m "Add dBFS readout below trace in now-playing strip"
```

---

## Task 8: Header + nav restyle

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update header and nav blocks**

In `app/page.tsx`, locate the existing header block:

```tsx
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
```

Replace it with:

```tsx
      <header className="border-b border-hairline px-3 sm:px-4 py-3 flex items-end justify-between gap-3">
        <div className="border border-vdu-green-bright px-2.5 py-1 font-display text-[20px] sm:text-[22px] leading-none text-vdu-green-bright phosphor tracking-[0.08em]">
          UNHEARD&nbsp;//&nbsp;RADIO
        </div>
        <div className="text-right text-[10px] tracking-[0.12em] uppercase text-vdu-green-dim leading-relaxed">
          <div>// Listening Post</div>
          <div className="hidden sm:block">
            <span className="text-vdu-green">{stats ? stats.stations.toLocaleString() : '…'}</span> stations
            <span className="opacity-50 px-1.5">·</span>
            <span className="text-vdu-green">{stats ? stats.countries : '…'}</span> countries
          </div>
        </div>
      </header>
```

- [ ] **Step 2: Update the stats query to expose `countries`**

The existing query already returns `{ stations, countries, languages }` from `/api/stats`, but the type only declares `stations`. Update the type:

Find:
```tsx
  const { data: stats } = useQuery<{ stations: number }>({
```

Replace with:
```tsx
  const { data: stats } = useQuery<{ stations: number; countries: number; languages: number }>({
```

- [ ] **Step 3: Update the nav block**

Find:

```tsx
  const tabs = [
    { id: 'discover' as Tab, icon: Radar, label: 'Discover', shortLabel: 'Radar' },
    { id: 'search' as Tab, icon: Search, label: 'Filter', shortLabel: 'Filter' },
    { id: 'saved' as Tab, icon: Bookmark, label: 'Saved', shortLabel: 'Saved' },
    { id: 'map' as Tab, icon: MapPin, label: 'Map', shortLabel: 'Map' },
    { id: 'about' as Tab, icon: Info, label: 'About', shortLabel: 'About' },
  ]
```

Replace with:

```tsx
  const tabs = [
    { id: 'discover' as Tab, icon: Discover, label: 'SCAN', num: '01' },
    { id: 'search' as Tab, icon: Filter, label: 'FILTER', num: '02' },
    { id: 'saved' as Tab, icon: Log, label: 'LOG', num: '03' },
    { id: 'map' as Tab, icon: MapPin, label: 'GRID', num: '04' },
    { id: 'about' as Tab, icon: Info, label: 'NFO', num: '05' },
  ]
```

- [ ] **Step 4: Replace the lucide-react import**

Find:
```tsx
import { Radar, Search, Bookmark, MapPin, Info } from 'lucide-react'
```

Replace with:
```tsx
import { Discover, Filter, Log, MapPin, Info } from '@/components/icons'
```

- [ ] **Step 5: Update the nav button rendering**

Find:

```tsx
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
```

Replace with:

```tsx
      <nav className="border-b border-hairline overflow-x-auto">
        <div className="flex min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-r border-hairline transition-colors text-[11px] tracking-[0.12em] uppercase whitespace-nowrap ${
                  active
                    ? 'text-vdu-green-bright bg-vdu-green/[0.06] phosphor border-b-2 border-b-vdu-green-bright'
                    : 'text-vdu-green-dim hover:text-vdu-green'
                }`}
                title={tab.label}
              >
                <Icon size={12} />
                <span className="hidden sm:inline text-vdu-green-faint text-[9px]">{tab.num}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
```

- [ ] **Step 6: Build check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Visual check**

`npm run dev`. Header should now show a stamped wordmark on the left and right-aligned "Listening Post" tagline + stats. Nav tabs should read `01 SCAN · 02 FILTER · 03 LOG · 04 GRID · 05 NFO` with channel numbers in faint green. Active tab has a bright bottom underline + phosphor glow. On mobile width, channel numbers should disappear; just verbs visible.

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx
git commit -m "Restyle header (Listening Post stamp) and nav (operational verbs)"
```

---

## Task 9: Fullscreen station — chrome restyle + waterfall

**Files:**
- Modify: `components/fullscreen-station.tsx`

- [ ] **Step 1: Read current fullscreen-station.tsx to understand structure**

Run: `wc -l components/fullscreen-station.tsx`
Expected: ~470 lines.

- [ ] **Step 2: Replace the imports and decorative grid background**

Find the imports block:

```tsx
import { useState, useEffect } from 'react';
import { Minimize2, Share2, Bookmark, Radio, Signal, Globe, Clock, Users, Headphones } from 'lucide-react';
import { RadioStation } from '@/types/radio';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { getObscurityBadge, generateStationDescription, getTimeOnAir, getStationPopularity, getStreamQuality } from '@/lib/radio-api';
import { AudioVisualizer } from '@/components/audio-visualizer';
import { ShareMenu } from './share-menu';
```

Replace with:

```tsx
import { useEffect } from 'react';
import { RadioStation } from '@/types/radio';
import { useAudioStore } from '@/lib/audio-store';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { getObscurityBadge, generateStationDescription, getTimeOnAir, getStationPopularity, getStreamQuality } from '@/lib/radio-api';
import { AudioVisualizer } from '@/components/audio-visualizer';
import { ShareMenu } from './share-menu';
import { Close, Log, LogOn, Send, Play, Stop } from './icons';
import { getBand, getStationId, getCoords, getOrigin, getRate, getUptime } from '@/lib/station-format';
```

- [ ] **Step 3: Remove the unused `useState` since we no longer need it (verify by checking the file)**

Run: `grep -n "useState" components/fullscreen-station.tsx`

If `useState` is only on the import line and not used elsewhere, the import update in Step 2 already removed it. If it IS used somewhere, leave the import as `import { useEffect, useState } from 'react'`.

- [ ] **Step 4: Replace the decorative grid background block**

Find:

```tsx
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
```

Replace with:

```tsx
      {/* Waterfall spectrogram backdrop */}
      <div className="absolute inset-x-0 top-0 h-60 opacity-50 pointer-events-none">
        <AudioVisualizer mode="waterfall" height={240} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, hsl(var(--background)) 100%)' }} />
      </div>
```

- [ ] **Step 5: Replace the SHARE button block**

Find:

```tsx
            <ShareMenu
              station={station}
              iconClassName="flex items-center space-x-1 px-3 py-1 rounded-lg border border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-all font-bold text-xs"
              trigger={<><Share2 className="w-3 h-3" /><span>SHARE</span></>}
            />
```

Replace with:

```tsx
            <ShareMenu
              station={station}
              iconClassName="flex items-center gap-1.5 px-3 py-1 border border-vdu-green-dim text-vdu-green-dim hover:border-vdu-green hover:text-vdu-green transition-colors text-[11px] tracking-[0.12em] uppercase"
              trigger={<><Send size={12} /><span>SEND</span></>}
            />
```

- [ ] **Step 6: Replace remaining `lucide-react` icon usages**

Search for residual lucide icons in the file:

Run: `grep -nE '<(Minimize2|Bookmark|Radio|Signal|Globe|Clock|Users|Headphones)' components/fullscreen-station.tsx`

For each result:

- `<Minimize2 ... />` → `<Close size={14} />`
- `<Bookmark className="w-3 h-3" />` (when bookmarked false) → `<Log size={12} />`
- `<Bookmark className="w-3 h-3 fill-current" />` (when bookmarked true) → `<LogOn size={12} />`
- `<Radio>`, `<Signal>`, `<Globe>`, `<Clock>`, `<Users>`, `<Headphones>` — these are decorative inside the metadata cards. Replace each with the corresponding semantically closest glyph from the new kit, or if there's no good match, simply DELETE the icon (the labels are clear without them):
  - `<Radio>` → delete (the "Stream" card label is sufficient)
  - `<Signal>` → delete
  - `<Globe>` → keep an SVG: replace with `<MapPin size={12} />` (import `MapPin` from icons if not already)
  - `<Clock>` → delete
  - `<Users>` → delete
  - `<Headphones>` → delete

- [ ] **Step 7: Replace the rounded-lg / rounded-xl corners + glow tokens**

Run: `grep -n "rounded-" components/fullscreen-station.tsx | head -20`

For each match, replace `rounded-lg` / `rounded-xl` / `rounded-full` with no class (drop the rounded class entirely — Listening Post has square corners). Use sed-style global replace by editing each line manually.

Run: `grep -n "border-vdu-green-dim" components/fullscreen-station.tsx | head -10`

These are fine as-is (existing token, still defined). No change needed.

- [ ] **Step 8: Build check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 9: Visual check**

`npm run dev`, play a station, click the inspect (corner-bracket) icon on its card. The fullscreen view should appear with:

- A waterfall spectrogram filling the top ~240px, fading down into the page background
- Square-cornered metadata cards
- Listening Post icons throughout (Close, Log, Send, etc.)
- The SHARE button reads "SEND" and uses the new send glyph
- Pressing Escape or clicking close still works.

- [ ] **Step 10: Commit**

```bash
git add components/fullscreen-station.tsx
git commit -m "Restyle fullscreen station view with waterfall backdrop and new icons"
```

---

## Task 10: Search sidebar polish

**Files:**
- Modify: `components/search-sidebar.tsx`

- [ ] **Step 1: Update imports**

Find:
```tsx
import { Search, Radio, RotateCcw } from 'lucide-react';
```

Replace with:
```tsx
import { Search as SearchIcon, Rescan } from '@/components/icons';
```

- [ ] **Step 2: Update the FILTERS header and APPLY button**

Find:
```tsx
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-vdu-green tracking-tight">FILTERS</h2>
          <Button
            onClick={handleRefresh}
            size="sm"
            className="bg-vdu-green text-radio-black hover:bg-vdu-green-bright text-xs font-bold px-3 py-1 h-auto"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            APPLY
          </Button>
        </div>
```

Replace with:
```tsx
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[22px] leading-none text-vdu-green-bright phosphor tracking-[0.05em]">// FILTERS</h2>
          <Button
            onClick={handleRefresh}
            size="sm"
            className="bg-vdu-green-bright text-radio-black hover:bg-vdu-green text-[10px] tracking-[0.15em] uppercase font-bold px-3 py-1.5 h-auto rounded-none"
          >
            <Rescan size={12} className="mr-1.5" />
            APPLY
          </Button>
        </div>
```

- [ ] **Step 3: Update the search input icon**

Find:
```tsx
          <Search className="absolute right-2 top-2 h-3 w-3 text-gray-500" />
```

Replace with:
```tsx
          <SearchIcon size={12} className="absolute right-2.5 top-2.5 text-vdu-green-dim" />
```

- [ ] **Step 4: Update section headers**

Find each occurrence:
```tsx
          <h3 className="text-xs font-semibold text-vdu-green uppercase tracking-wide">Audience Size</h3>
```

Replace with:
```tsx
          <h3 className="text-[10px] font-bold text-vdu-green-dim uppercase tracking-[0.15em]">// AUDIENCE&nbsp;SIZE</h3>
```

Same treatment for the Location and Genre headers — convert to:
```tsx
          <h3 className="text-[10px] font-bold text-vdu-green-dim uppercase tracking-[0.15em]">// LOCATION</h3>
```
and
```tsx
          <h3 className="text-[10px] font-bold text-vdu-green-dim uppercase tracking-[0.15em]">// GENRE</h3>
```

- [ ] **Step 5: Update the stations-indexed line**

Find:
```tsx
        <div className="text-center">
          <div className="text-xs text-muted font-medium">STATIONS INDEXED</div>
          <div className="text-sm text-vdu-green font-black">{totalStations.toLocaleString()}</div>
        </div>
```

Replace with:
```tsx
        <div className="border-t border-b border-hairline py-2 flex items-baseline justify-between">
          <span className="text-[10px] tracking-[0.15em] uppercase text-vdu-green-dim">// Indexed</span>
          <span className="font-display text-[20px] leading-none text-vdu-green-bright">{totalStations.toLocaleString()}</span>
        </div>
```

- [ ] **Step 6: Update the usage instruction footer**

Find:
```tsx
        <div className="mt-3 pt-3 border-t border-vdu-green-dim">
          <p className="text-xs text-gray-400 leading-relaxed">
            Set filters and click <span className="text-vdu-green font-bold">APPLY</span> to search the discovery feed with your criteria.
          </p>
        </div>
```

Replace with:
```tsx
        <div className="mt-3 pt-3 border-t border-hairline">
          <p className="text-[10px] tracking-[0.05em] uppercase text-vdu-green-dim leading-relaxed">
            Set filters · press <span className="text-vdu-green-bright">APPLY</span> · returns to SCAN feed
          </p>
        </div>
```

- [ ] **Step 7: Build check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 8: Visual check**

`npm run dev`, click the FILTER tab. Sidebar should show `// FILTERS` header in VT323, the indexed station count in big VT323, section headers prefixed with `//` and dimmer, and the APPLY button using the new Rescan glyph.

- [ ] **Step 9: Commit**

```bash
git add components/search-sidebar.tsx
git commit -m "Restyle search sidebar with Listening Post chrome"
```

---

## Task 11: Share menu polish

**Files:**
- Modify: `components/share-menu.tsx`

- [ ] **Step 1: Update imports**

Find:
```tsx
import { Share2, Link as LinkIcon, Check, MessageCircle, Send, Mail, X } from 'lucide-react'
```

Replace with:
```tsx
import { Send as SendIcon, Close } from '@/components/icons'
```

We will use Unicode/inline SVG for the Copy/WhatsApp/Telegram/X/Email rows since the new icon kit doesn't include all of them. The rows are clearly text-labeled, so symbols can be minimal mono glyphs.

- [ ] **Step 2: Update the trigger fallback**

Find:
```tsx
        {trigger ?? <Share2 className="w-3 h-3" />}
```

Replace with:
```tsx
        {trigger ?? <SendIcon size={12} />}
```

- [ ] **Step 3: Restyle the popover container**

Find:
```tsx
        <div
          onClick={stop}
          role="menu"
          className="absolute right-0 top-full mt-2 z-[60] w-56 rounded-lg border border-vdu-green-dim bg-black/95 backdrop-blur p-1 shadow-xl"
        >
```

Replace with:
```tsx
        <div
          onClick={stop}
          role="menu"
          className="absolute right-0 top-full mt-2 z-[60] w-56 border border-vdu-green-dim bg-radio-panel p-1 shadow-[0_4px_20px_hsla(120,100%,40%,0.12)]"
        >
```

- [ ] **Step 4: Update the header row**

Find:
```tsx
          <div className="flex items-center justify-between px-2 py-1.5 text-xs text-vdu-green-dim">
            <span>Share station</span>
            <button
              onClick={() => setOpen(false)}
              className="text-vdu-green-dim hover:text-vdu-green"
              aria-label="Close share menu"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
```

Replace with:
```tsx
          <div className="flex items-center justify-between px-2 py-1.5 text-[10px] tracking-[0.15em] uppercase text-vdu-green-dim border-b border-hairline mb-1">
            <span>// Send to</span>
            <button
              onClick={() => setOpen(false)}
              className="text-vdu-green-dim hover:text-vdu-green-bright"
              aria-label="Close share menu"
            >
              <Close size={10} />
            </button>
          </div>
```

- [ ] **Step 5: Restyle each menu item**

Find every menu row (Copy link, WhatsApp, Telegram, X / Twitter, Email). They share this pattern:

```tsx
            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-vdu-green hover:bg-vdu-green/10 rounded font-mono"
```

Replace each occurrence with:
```tsx
            className="w-full flex items-center gap-2 px-2 py-2 text-[11px] tracking-[0.05em] uppercase text-vdu-green hover:bg-vdu-green/10 hover:text-vdu-green-bright transition-colors"
```

(Tailwind's `replace_all` won't help here — there are 5 menu rows; do them one at a time using Edit.)

- [ ] **Step 6: Replace the icon glyphs in each menu row**

The current implementations use `LinkIcon` for Copy, `MessageCircle` for WhatsApp, `Send` for Telegram, `X` for Twitter, `Mail` for Email. None of these exist in our import anymore. Replace each `<LinkIcon ... />`, `<MessageCircle ... />`, etc. with simple inline mono characters wrapped in styled spans:

For the Copy row:
```tsx
            <span className="font-display text-[14px] leading-none w-4">⎘</span>
```
(replaces `<LinkIcon className="w-4 h-4" /> ` or `<Check className="w-4 h-4" />` for the copied state)

For the WhatsApp row:
```tsx
            <span className="font-display text-[14px] leading-none w-4">W</span>
```

For the Telegram row:
```tsx
            <span className="font-display text-[14px] leading-none w-4">T</span>
```

For the X / Twitter row:
```tsx
            <span className="font-display text-[14px] leading-none w-4">X</span>
```

For the Email row:
```tsx
            <span className="font-display text-[14px] leading-none w-4">@</span>
```

Update the Copy row's "copied" branch to swap the glyph:
```tsx
            {copied ? <span className="font-display text-[14px] leading-none w-4">✓</span> : <span className="font-display text-[14px] leading-none w-4">⎘</span>}
```

- [ ] **Step 7: Build check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 8: Visual check**

`npm run dev`, click the share button on a station card. Popover should appear with: `// SEND TO` header, square-cornered border, monospace single-character glyphs (⎘ W T X @) on each row, hover lights rows up.

Click "Copy link" — text should briefly change to ✓ and a toast should appear ("Link copied").

- [ ] **Step 9: Commit**

```bash
git add components/share-menu.tsx
git commit -m "Restyle share menu with Listening Post chrome and mono glyphs"
```

---

## Task 12: DiscoveryList + BookmarkList header polish

**Files:**
- Modify: `components/discovery-list.tsx`
- Modify: `components/bookmark-list.tsx`

- [ ] **Step 1: Read both files to understand structure**

Run: `grep -n "Ultra-Obscure Transmissions\|Saved Stations\|Random Drift\|font-serif" components/discovery-list.tsx components/bookmark-list.tsx`

- [ ] **Step 2: Update DiscoveryList header**

In `components/discovery-list.tsx`, find:

```tsx
          <h2 className="text-lg md:text-xl font-bold text-vdu-green font-serif">
            Ultra-Obscure Transmissions
          </h2>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
```

Replace with:
```tsx
          <h2 className="font-display text-[22px] md:text-[28px] leading-none text-vdu-green-bright phosphor tracking-[0.04em]">
            // OBSCURE TRANSMISSIONS
          </h2>
          <p className="text-[10px] tracking-[0.12em] uppercase text-vdu-green-dim mt-1.5">
```

- [ ] **Step 3: Replace Random Drift button (DiscoveryList)**

Find:

```tsx
import { Shuffle, Loader2 } from 'lucide-react';
```

Replace with:
```tsx
import { Loader2 } from 'lucide-react';
import { Scan } from '@/components/icons';
```

Find:

```tsx
            <Button
              onClick={handleRandomDrift}
              variant="outline"
              size="sm"
              className="border-vdu-green-dim text-vdu-green hover:bg-vdu-green hover:text-radio-black text-xs md:text-sm"
            >
              <Shuffle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden md:inline">Random Drift</span>
              <span className="md:hidden">Random</span>
            </Button>
```

Replace with:
```tsx
            <Button
              onClick={handleRandomDrift}
              variant="outline"
              size="sm"
              className="border-vdu-green-dim text-vdu-green hover:bg-vdu-green-bright hover:text-radio-black text-[10px] tracking-[0.15em] uppercase font-bold rounded-none"
            >
              <Scan size={12} className="mr-1.5" />
              <span className="hidden md:inline">RANDOM DRIFT</span>
              <span className="md:hidden">RANDOM</span>
            </Button>
```

- [ ] **Step 4: Update BookmarkList header to match**

In `components/bookmark-list.tsx`, find the title block. Whatever the current heading text and class is, replace the heading element with the same style as DiscoveryList:

If the existing line is something like:
```tsx
<h2 className="text-lg md:text-xl font-bold text-vdu-green font-serif">Saved Stations</h2>
```

Replace with:
```tsx
<h2 className="font-display text-[22px] md:text-[28px] leading-none text-vdu-green-bright phosphor tracking-[0.04em]">// LOG / SAVED CONTACTS</h2>
```

Replace any nearby description paragraph with:
```tsx
<p className="text-[10px] tracking-[0.12em] uppercase text-vdu-green-dim mt-1.5">{count} saved {count === 1 ? 'contact' : 'contacts'}</p>
```

(Adapt to the existing variable name — it may be `bookmarks.length` or similar.)

- [ ] **Step 5: Build check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Visual check**

`npm run dev`. SCAN tab heading should read `// OBSCURE TRANSMISSIONS` in VT323, with a small uppercase subtitle. LOG tab heading should read `// LOG / SAVED CONTACTS`. Random button should be square-cornered and use the SCAN glyph.

- [ ] **Step 7: Commit**

```bash
git add components/discovery-list.tsx components/bookmark-list.tsx
git commit -m "Match list-header chrome to Listening Post (DiscoveryList + BookmarkList)"
```

---

## Task 13: Final sweep — remove residual lucide imports and audio-player.tsx

**Files:**
- Verify and clean: residual `lucide-react` imports
- Modify or delete: `components/audio-player.tsx` (likely unused)

- [ ] **Step 1: Find any remaining lucide imports**

Run: `grep -rn "from 'lucide-react'" components app 2>/dev/null`

For each result:
- If the file is `components/audio-player.tsx`, check if it's imported anywhere else first: `grep -rn "from '@/components/audio-player'\|from './audio-player'" components app 2>/dev/null`. If unused, **delete the file**: `rm components/audio-player.tsx`.
- If the file is `components/discovery-list.tsx` and the only remaining lucide import is `Loader2`, that's fine — leave it (Loader2 is the spinner, harmless).
- For other components with lucide imports: replace each icon with the new kit equivalent from `components/icons.tsx`. If no equivalent exists in the kit, add it to `icons.tsx` (≤14×14, 1.5px stroke, square caps).

- [ ] **Step 2: Confirm only `Loader2` remains as a lucide import (acceptable)**

Run: `grep -rn "from 'lucide-react'" components app 2>/dev/null`
Expected: zero results, OR results showing only `import { Loader2 } from 'lucide-react'`. Anything else is a bug.

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: build succeeds. Note bundle size — should be flat or smaller than before.

- [ ] **Step 4: Visual full smoke test**

`npm run dev`. Walk through every surface:

1. Header + nav: stamp wordmark, tab numbers, active glow
2. SCAN tab: station rows in log-entry format
3. Click play: row becomes active, RX ACTIVE pulse appears
4. Now-playing strip at bottom: trace + dBFS readout (≥md width), controls
5. Click bookmark: row's log icon fills, switches state
6. Click share: popover opens with new chrome, click Copy → ✓ glyph
7. Click inspect: fullscreen view opens with waterfall backdrop
8. Press Escape: fullscreen closes
9. FILTER tab: sidebar with `// FILTERS` header, indexed counter, APPLY button with Rescan glyph
10. LOG tab: bookmarks list with new chrome
11. GRID tab: map placeholder still renders (out of scope, no change)
12. NFO tab: about content, Privacy link works
13. Mobile narrow (375×812): nav numbers hide, callsign metadata wraps, strip visualizer hides, station card data block collapses to 2 cols
14. Tablet (768×1024): everything visible cleanly, no overflow

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Remove residual lucide imports and clean up dead audio-player.tsx"
```

---

## Task 14: Update CLAUDE.md to reflect new design system

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add a Design System section**

Edit `CLAUDE.md`. After the existing `### Styling` section, replace its body to incorporate the new tokens. Find:

```markdown
### Styling
Tailwind + shadcn/ui (style: `new-york`). Terminal aesthetic uses CSS variables `--vdu-green`, `--vdu-green-bright`, `--vdu-green-dim`, `--accent-cyan` defined in `app/globals.css` and exposed as Tailwind colors in `tailwind.config.ts`. Use those tokens rather than raw hex when adding UI. The whole app is mobile-first: header, tabs, cards, sidebar all scale via `sm:`/`md:`/`lg:` breakpoints — match that pattern.
```

Replace with:

```markdown
### Styling — Listening Post design system
Tailwind + shadcn/ui (style: `new-york`). The app uses a deliberate "SIGINT listening post" treatment defined in `docs/superpowers/specs/2026-04-29-listening-post-ui-design.md`.

Color discipline: `--vdu-green-bright` and `--accent-cyan` are scarce. Bright is reserved for the **active station + primary actions + brand wordmark only**. Cyan is reserved for **live RX pulse, visualizer trace cursor, and waterfall hot-end** — no other use. Most chrome should sit between `--vdu-green-dim` and `--vdu-green`. The fonts are JetBrains Mono (body/data) and VT323 (`.font-display`, used for brand and section headers).

**Iconography:** all icons live in `components/icons.tsx` as 14×14 SVG components with 1.5px stroke and square caps. Do not introduce Lucide icons. If a new glyph is needed, draft it into that file matching the existing style.

**Station data formatting:** all "BAND / ID / COORDS / ORIGIN / RX / RATE / UPTIME" derivations live in `lib/station-format.ts`. Use those helpers from any surface that displays station metadata so the language stays consistent.

The whole app is mobile-first: header, tabs, cards, sidebar all scale via `sm:`/`md:`/`lg:` breakpoints — match that pattern. Channel numbers in nav, coords in card metadata, and the strip visualizer all hide below `sm`.
```

- [ ] **Step 2: Build check (sanity)**

Run: `npm run build`
Expected: build succeeds (CLAUDE.md doesn't affect build, but confirm nothing else regressed).

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Document the Listening Post design system in CLAUDE.md"
```

---

## Done when

1. `npm run build` is green.
2. `grep -rn "from 'lucide-react'"` returns at most `Loader2` imports in `discovery-list.tsx` (the spinner — keeping it is fine; it's not a chrome icon).
3. All 14 tasks committed in order; `git log --oneline | head -15` shows the implementation history cleanly.
4. Live walk-through (Task 13 step 4) confirms every surface renders correctly at desktop and 375px mobile width.
5. The active station row glow is the brightest thing on screen when playback is on.
6. CLAUDE.md reflects the new design system and points future agents at the spec.
