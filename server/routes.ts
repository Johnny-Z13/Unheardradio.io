import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // RadioBrowser API proxy routes
  app.get("/api/stations", async (req, res) => {
    try {
      const { limit = 50, offset = 0, country, genre, search } = req.query;
      
      // Try multiple RadioBrowser API servers for better reliability
      const servers = [
        "http://all.api.radio-browser.info/json/stations/search",
        "http://at1.api.radio-browser.info/json/stations/search",
        "http://de1.api.radio-browser.info/json/stations/search"
      ];
      
      let stations = [];
      let lastError: Error | null = null;
      
      for (const server of servers) {
        try {
          // Build API URL
          let apiUrl = `${server}?limit=${limit}&offset=${offset}&order=clickcount&reverse=false`;
          
          if (country) apiUrl += `&country=${encodeURIComponent(country as string)}`;
          if (genre) apiUrl += `&tag=${encodeURIComponent(genre as string)}`;
          if (search) apiUrl += `&name=${encodeURIComponent(search as string)}`;
          
          const response = await fetch(apiUrl, {
            headers: { 'User-Agent': 'SignalDrift/1.0' }
          });
          
          if (response.ok) {
            stations = await response.json();
            break;
          }
        } catch (err) {
          lastError = err as Error;
          continue;
        }
      }
      
      if (stations.length === 0) {
        throw lastError || new Error("All RadioBrowser servers unavailable");
      }
      
      // Sort by reverse popularity (lowest clickcount first)
      const sortedStations = stations.sort((a: any, b: any) => {
        const aClicks = parseInt(a.clickcount) || 0;
        const bClicks = parseInt(b.clickcount) || 0;
        return aClicks - bClicks;
      });
      
      res.json(sortedStations);
    } catch (error) {
      console.error("Error fetching stations:", error);
      res.status(500).json({ message: "Failed to fetch radio stations" });
    }
  });

  app.get("/api/countries", async (req, res) => {
    try {
      // Try multiple RadioBrowser API servers for better reliability
      const servers = [
        "http://all.api.radio-browser.info/json/countries",
        "http://at1.api.radio-browser.info/json/countries",
        "http://de1.api.radio-browser.info/json/countries"
      ];
      
      let countries = [];
      let lastError: Error | null = null;
      
      for (const server of servers) {
        try {
          const response = await fetch(server, { 
            headers: { 'User-Agent': 'SignalDrift/1.0' }
          });
          if (response.ok) {
            countries = await response.json();
            break;
          }
        } catch (err) {
          lastError = err as Error;
          continue;
        }
      }
      
      if (countries.length === 0) {
        throw lastError || new Error("All RadioBrowser servers unavailable");
      }
      
      // Sort by country name and filter out countries with very few stations
      const filteredCountries = countries
        .filter((country: any) => country.stationcount > 5)
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      
      res.json(filteredCountries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      // Return empty array instead of error to keep UI functional
      res.json([]);
    }
  });

  app.get("/api/genres", async (req, res) => {
    try {
      // Try multiple RadioBrowser API servers for better reliability
      const servers = [
        "http://all.api.radio-browser.info/json/tags",
        "http://at1.api.radio-browser.info/json/tags",
        "http://de1.api.radio-browser.info/json/tags"
      ];
      
      let tags = [];
      let lastError: Error | null = null;
      
      for (const server of servers) {
        try {
          const response = await fetch(server, { 
            headers: { 'User-Agent': 'SignalDrift/1.0' }
          });
          if (response.ok) {
            tags = await response.json();
            break;
          }
        } catch (err) {
          lastError = err as Error;
          continue;
        }
      }
      
      if (tags.length === 0) {
        throw lastError || new Error("All RadioBrowser servers unavailable");
      }
      
      // Filter and sort genres
      const genres = tags
        .filter((tag: any) => tag.stationcount > 10)
        .sort((a: any, b: any) => a.name.localeCompare(b.name))
        .slice(0, 100); // Limit to top 100 genres
      
      res.json(genres);
    } catch (error) {
      console.error("Error fetching genres:", error);
      // Return empty array instead of error to keep UI functional
      res.json([]);
    }
  });

  // Station click tracking (for RadioBrowser API)
  app.post("/api/stations/:uuid/click", async (req, res) => {
    try {
      const { uuid } = req.params;
      const response = await fetch(`http://all.api.radio-browser.info/json/url/${uuid}`);
      
      if (!response.ok) {
        throw new Error(`RadioBrowser API error: ${response.status}`);
      }
      
      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error("Error tracking station click:", error);
      res.status(500).json({ message: "Failed to track station click" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
