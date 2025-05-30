import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as https from 'https';

interface StormData {
  date_of_loss: string;
  affected_city: string;
  storm_type: string;
  hail_size: string;
  is_hail_event: boolean;
  is_tornado_event: boolean;
  hail_less_than_1_5: boolean;
  event_details: string;
  generated_at: string;
}

interface CSVStormEvent {
  EVENT_TYPE: string;
  STATE: string;
  CZ_NAME: string;
  BEGIN_LOCATION: string;
  BEGIN_DATE_TIME: string;
  MAGNITUDE: string;
  EVENT_ID: string;
  EVENT_NARRATIVE: string;
}

export class StormDataService {
  private readonly OKC_METRO_CITIES = [
    'oklahoma city', 'edmond', 'norman', 'moore', 'midwest city',
    'yukon', 'bethany', 'del city', 'mustang', 'nichols hills'
  ];

  private csvCacheFile = path.join(process.cwd(), 'noaa_storm_events_cache.json');
  private trendsFile = path.join(process.cwd(), 'trending_phrases.json');
  private lastDownload = 0;
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    console.log('Storm Data Service initialized with NOAA CSV data source');
  }

  /**
   * Download and parse the latest NOAA storm events CSV
   */
  async downloadAndParseCSV(): Promise<CSVStormEvent[]> {
    const now = Date.now();
    
    // Check if we have cached data that's still fresh
    if (fs.existsSync(this.csvCacheFile) && (now - this.lastDownload) < this.cacheExpiry) {
      console.log('Using cached NOAA storm events data');
      const cached = JSON.parse(fs.readFileSync(this.csvCacheFile, 'utf8'));
      return cached.events || [];
    }

    console.log('Downloading latest NOAA storm events CSV...');
    
    try {
      // Download the 2024 storm events CSV file
      const csvUrl = 'https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/StormEvents_details-ftp_v1.0_d2024_c20250520.csv.gz';
      
      const csvData = await this.downloadFile(csvUrl);
      const decompressed = zlib.gunzipSync(csvData);
      const csvText = decompressed.toString('utf8');
      
      const events = this.parseCSV(csvText);
      
      // Cache the results
      fs.writeFileSync(this.csvCacheFile, JSON.stringify({
        events,
        downloadTime: now,
        url: csvUrl
      }));
      
      this.lastDownload = now;
      console.log(`Successfully parsed ${events.length} relevant storm events from CSV`);
      
      return events;
      
    } catch (error) {
      console.error('Error downloading/parsing CSV:', error);
      
      // Try to use stale cached data if available
      if (fs.existsSync(this.csvCacheFile)) {
        console.log('Using stale cached data due to download error');
        const cached = JSON.parse(fs.readFileSync(this.csvCacheFile, 'utf8'));
        return cached.events || [];
      }
      
      return [];
    }
  }

  /**
   * Download file from URL
   */
  private downloadFile(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
  }

  /**
   * Parse CSV and filter for Oklahoma storm events
   */
  private parseCSV(csvText: string): CSVStormEvent[] {
    const lines = csvText.split('\n');
    if (lines.length < 2) return [];
    
    const headers = this.parseCSVLine(lines[0]).map(h => h.trim());
    const events: CSVStormEvent[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      if (values.length < headers.length) continue;
      
      const event: any = {};
      headers.forEach((header, index) => {
        event[header] = values[index] ? values[index].trim() : '';
      });
      
      // Filter: Must be Oklahoma
      if (event.STATE !== 'OKLAHOMA') continue;
      
      // Filter: Must be Hail or Tornado
      const eventType = event.EVENT_TYPE?.toLowerCase() || '';
      if (!eventType.includes('hail') && !eventType.includes('tornado')) continue;
      
      // Filter: Must be in OKC metro area
      const location = ((event.CZ_NAME || '') + ' ' + (event.BEGIN_LOCATION || '')).toLowerCase();
      const isInMetro = this.OKC_METRO_CITIES.some(city => 
        location.includes(city.toLowerCase())
      );
      
      if (!isInMetro) continue;
      
      // For hail events, filter by magnitude >= 2.0
      if (eventType.includes('hail')) {
        const magnitude = parseFloat(event.MAGNITUDE || '0');
        if (magnitude < 2.0) continue;
      }
      
      events.push({
        EVENT_TYPE: event.EVENT_TYPE || '',
        STATE: event.STATE || '',
        CZ_NAME: event.CZ_NAME || '',
        BEGIN_LOCATION: event.BEGIN_LOCATION || '',
        BEGIN_DATE_TIME: event.BEGIN_DATE_TIME || '',
        MAGNITUDE: event.MAGNITUDE || '0',
        EVENT_ID: event.EVENT_ID || '',
        EVENT_NARRATIVE: event.EVENT_NARRATIVE || ''
      });
    }
    
    return events;
  }

  /**
   * Parse CSV line handling quoted values properly
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current);
    return values;
  }

  /**
   * Get daily hail content from CSV data
   */
  async getDailyHailContent(phrase?: string): Promise<StormData | null> {
    try {
      const events = await this.downloadAndParseCSV();
      
      // Filter for hail events only
      const hailEvents = events.filter(event => 
        event.EVENT_TYPE.toLowerCase().includes('hail') &&
        parseFloat(event.MAGNITUDE) >= 2.0
      );
      
      if (hailEvents.length === 0) {
        console.log('No hail events >= 2.0" found in OKC metro from CSV');
        return null;
      }
      
      // Daily rotation based on current date
      const today = new Date().toDateString();
      const dayHash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const eventIndex = dayHash % hailEvents.length;
      
      return this.convertCSVEventToStormData(hailEvents[eventIndex]);
      
    } catch (error) {
      console.error('Error getting daily hail content:', error);
      return null;
    }
  }

  /**
   * Get tornado content from CSV data
   */
  async getTornadoContent(): Promise<StormData | null> {
    try {
      const events = await this.downloadAndParseCSV();
      
      // Filter for tornado events from the past 14 days
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const tornadoEvents = events.filter(event => {
        if (!event.EVENT_TYPE.toLowerCase().includes('tornado')) return false;
        
        try {
          const eventDate = new Date(event.BEGIN_DATE_TIME);
          return eventDate >= twoWeeksAgo;
        } catch {
          return false;
        }
      });
      
      if (tornadoEvents.length === 0) {
        console.log('No recent tornado events found in OKC metro from CSV');
        return null;
      }
      
      // Return most recent tornado event
      tornadoEvents.sort((a, b) => {
        const dateA = new Date(a.BEGIN_DATE_TIME).getTime();
        const dateB = new Date(b.BEGIN_DATE_TIME).getTime();
        return dateB - dateA;
      });
      
      return this.convertCSVEventToStormData(tornadoEvents[0]);
      
    } catch (error) {
      console.error('Error getting tornado content:', error);
      return null;
    }
  }

  /**
   * Convert CSV event to StormData format
   */
  private convertCSVEventToStormData(event: CSVStormEvent): StormData {
    const cityName = this.extractCityName(event.CZ_NAME || event.BEGIN_LOCATION);
    const isHail = event.EVENT_TYPE.toLowerCase().includes('hail');
    const magnitude = parseFloat(event.MAGNITUDE || '0');
    
    return {
      date_of_loss: this.formatDate(event.BEGIN_DATE_TIME),
      affected_city: cityName,
      storm_type: isHail ? 'hail' : 'tornado',
      hail_size: isHail ? `${magnitude}"` : '0"',
      is_hail_event: isHail,
      is_tornado_event: !isHail,
      hail_less_than_1_5: magnitude < 1.5,
      event_details: event.EVENT_NARRATIVE || `${event.EVENT_TYPE} event in ${cityName}`,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Extract city name from location string
   */
  private extractCityName(location: string): string {
    if (!location) return 'Oklahoma City';
    
    const cleanLocation = location.toLowerCase();
    
    for (const city of this.OKC_METRO_CITIES) {
      if (cleanLocation.includes(city)) {
        return this.toTitleCase(city);
      }
    }
    
    return 'Oklahoma City';
  }

  /**
   * Format date string to "Month Day, Year" format
   */
  private formatDate(dateStr: string): string {
    if (!dateStr) return 'Recent Storm Event';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'Recent Storm Event';
    }
  }

  /**
   * Convert string to title case
   */
  private toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Load trending phrases from generated file
   */
  private loadTrendingPhrases(): string[] {
    try {
      if (fs.existsSync(this.trendsFile)) {
        const trendsData = JSON.parse(fs.readFileSync(this.trendsFile, 'utf8'));
        return trendsData.phrases || [];
      }
    } catch (error) {
      console.error('Error loading trending phrases:', error);
    }
    
    // Fallback phrases if file doesn't exist
    return [
      'hail damage roof oklahoma',
      'tornado damage repair oklahoma', 
      'storm damage roofing oklahoma city',
      'roof repair after hail',
      'emergency roof repair oklahoma',
      'insurance claim roof damage',
      'hail storm oklahoma city',
      'tornado damage assessment'
    ];
  }

  /**
   * Get storm-related search patterns for matching
   */
  getStormSearchPatterns(): string[] {
    return this.loadTrendingPhrases();
  }

  /**
   * Get storm-related search patterns for matching
   */
  getStormSearchPatterns(): string[] {
    // Common storm-related search patterns that people use
    return [
      'hail damage roof', 'tornado damage roof', 'storm damage roof',
      'hail roof repair', 'tornado roof repair', 'storm roof repair',
      'roof hail damage', 'roof tornado damage', 'roof storm damage',
      'hail insurance claim', 'tornado insurance claim', 'storm insurance claim',
      'roof inspection hail', 'roof inspection tornado', 'roof inspection storm',
      'emergency roof repair', 'emergency roof service', 'roof tarping service'
    ];
  }

  /**
   * Match trending phrases with verified storm events
   */
  private matchPhrasesToEvents(phrases: string[], events: CSVStormEvent[]): CSVStormEvent[] {
    const matchedEvents: Array<{event: CSVStormEvent, score: number}> = [];
    
    for (const event of events) {
      let score = 0;
      const eventText = `${event.EVENT_TYPE} ${event.CZ_NAME} ${event.BEGIN_LOCATION} ${event.EVENT_NARRATIVE}`.toLowerCase();
      
      // Score based on phrase matches
      for (const phrase of phrases) {
        const phraseWords = phrase.toLowerCase().split(' ');
        for (const word of phraseWords) {
          if (word.length > 3 && eventText.includes(word)) {
            score += 1;
          }
        }
      }
      
      // Boost score for larger hail
      if (event.EVENT_TYPE.toLowerCase().includes('hail')) {
        const magnitude = parseFloat(event.MAGNITUDE || '0');
        if (magnitude >= 2.5) score += 3;
        if (magnitude >= 3.0) score += 5;
      }
      
      // Boost score for recent events
      try {
        const eventDate = new Date(event.BEGIN_DATE_TIME);
        const daysAgo = (Date.now() - eventDate.getTime()) / (24 * 60 * 60 * 1000);
        if (daysAgo < 30) score += 2;
        if (daysAgo < 7) score += 5;
      } catch {}
      
      if (score > 0) {
        matchedEvents.push({event, score});
      }
    }
    
    // Sort by score and return events
    return matchedEvents
      .sort((a, b) => b.score - a.score)
      .map(item => item.event);
  }


}

export const stormDataService = new StormDataService();