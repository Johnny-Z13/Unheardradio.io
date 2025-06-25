# Signal Drift - Radio Station Discovery App

## Overview

Signal Drift is a web application that discovers and curates the world's most obscure radio stations. Unlike traditional radio platforms that prioritize popular content, Signal Drift deliberately surfaces the least-played, most under-the-radar stations from around the globe. The application uses the RadioBrowser API to fetch station data and presents it through a unique "reverse popularity" lens, encouraging users to explore rare and experimental audio content.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand for audio player state, React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with custom configuration for client-side bundling

### Backend Architecture
- **Framework**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication (structure in place)
- **API Proxy**: Acts as a proxy to RadioBrowser API for station data

### Key Design Decisions
- **Monorepo Structure**: Client and server code organized in a single repository with shared types
- **API Proxy Pattern**: Backend proxies RadioBrowser API calls to avoid CORS issues and add custom sorting
- **Reverse Popularity Algorithm**: Stations sorted by lowest click count to surface obscure content
- **Component-Based UI**: Extensive use of Radix UI primitives through shadcn/ui for accessibility

## Key Components

### Client Components
- **Audio Player**: Global audio state management with HTML5 audio element
- **Station List**: Paginated display of radio stations with filtering capabilities
- **Search Sidebar**: Advanced filtering by country, genre, and search terms
- **Station Cards**: Individual station display with play/bookmark/share functionality
- **Now Playing Bar**: Persistent audio controls when a station is playing

### Server Components
- **Route Handlers**: API endpoints for stations, countries, and genres
- **Storage Layer**: Abstracted storage interface with in-memory implementation
- **Proxy Logic**: Custom sorting and filtering of RadioBrowser API responses

### Shared Components
- **Database Schema**: User and bookmark models using Drizzle ORM
- **Type Definitions**: TypeScript interfaces for radio stations and API responses

## Data Flow

1. **Station Discovery**: Client requests filtered station data from `/api/stations`
2. **API Proxy**: Server fetches data from RadioBrowser API with custom parameters
3. **Reverse Sorting**: Server applies "obscurity algorithm" (lowest click count sorting)
4. **Client Rendering**: Stations displayed in cards with metadata and controls
5. **Audio Playback**: Client-side audio management with global state
6. **Bookmarking**: Local storage-based bookmarking (database structure prepared)

## External Dependencies

### APIs
- **RadioBrowser API**: Primary data source for global radio station directory
- **Browser APIs**: HTML5 Audio API, Web Share API, Clipboard API

### Key Libraries
- **@neondatabase/serverless**: PostgreSQL connection (configured for Neon)
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database queries
- **zustand**: Lightweight state management
- **wouter**: Minimal routing solution

### UI/UX Libraries
- **@radix-ui/***: Accessible component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with hot reloading via Vite
- **Database**: PostgreSQL 16 module in Replit
- **Port Configuration**: Server runs on port 5000 with client dev server proxy

### Production Build
- **Client Build**: Vite builds static assets to `dist/public`
- **Server Build**: esbuild bundles server code to `dist/index.js`
- **Deployment Target**: Replit Autoscale with build/run commands configured

### Database Management
- **Migrations**: Drizzle Kit handles schema migrations
- **Connection**: Environment variable `DATABASE_URL` required
- **Schema**: Located in `shared/schema.ts` for type sharing

## Changelog

```
Changelog:
- June 25, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```