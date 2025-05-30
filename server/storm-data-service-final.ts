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
    console.log('Storm Data Service initialized with NOAA CSV data and trending phrase integration');
  }

  async downloadAndParseCSV(): Promise<CSVStormEvent[]> {
    const now = Date.now();
    
    if (fs.existsSync(this.csvCacheFile) && (now - this.lastDownload) < this.cacheExpiry) {
      console.log('Using cached NOAA storm events data');
      const cached = JSON.parse(fs.readFileSync(this.csvCacheFile, 'utf8'));
      return cached.events || [];
    }

    console.log('Downloading latest NOAA storm events CSV...');
    
    try {
      const csvUrl = 'https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/StormEvents_details-ftp_v1.0_d2024_c20250520.csv.gz';
      
      const csvData = await this.downloadFile(csvUrl);
      const decompressed = zlib.gunzipSync(csvData);
      const csvText = decompressed.toString('utf8');
      
      const events = this.parseCSV(csvText);
      
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
      
      if (fs.existsSync(this.csvCacheFile)) {
        console.log('Using stale cached data due to download error');
        const cached = JSON.parse(fs.readFileSync(this.csvCacheFile, 'utf8'));
        return cached.events || [];
      }
      
      return [];
    }
  }

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

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
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

  private loadTrendingPhrases(): string[] {
    try {
      if (fs.existsSync(this.trendsFile)) {
        const trendsData = JSON.parse(fs.readFileSync(this.trendsFile, 'utf8'));
        console.log(`Loaded ${trendsData.phrases?.length || 0} trending phrases for storm matching`);
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

  private matchPhrasesToEvents(phrases: string[], events: CSVStormEvent[]): CSVStormEvent[] {
    const matchedEvents: Array<{event: CSVStormEvent, score: number}> = [];

    events.forEach(event => {
      let score = 0;
      const eventText = `${event.EVENT_TYPE} ${event.CZ_NAME} ${event.BEGIN_LOCATION} ${event.EVENT_NARRATIVE}`.toLowerCase();
      
      phrases.forEach(phrase => {
        const phraseWords = phrase.toLowerCase().split(' ');
        phraseWords.forEach(word => {
          if (word.length > 3 && eventText.includes(word)) {
            score += 1;
          }
        });
      });
      
      // Boost score for larger hail
      if (event.EVENT_TYPE.toLowerCase().includes('hail')) {
        const magnitude = parseFloat(event.MAGNITUDE || '0');
        if (magnitude >= 2.5) score += 3;
        if (magnitude >= 3.0) score += 5;
      }
      
      // Boost score for recent events
      try {
        const eventDate = new Date(event.BEGIN_DATE_TIME);
        const daysSince = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince <= 7) score += 5;
        if (daysSince <= 30) score += 2;
      } catch {
        // Skip date parsing errors
      }
      
      if (score > 0) {
        matchedEvents.push({event, score});
      }
    });

    return matchedEvents
      .sort((a, b) => b.score - a.score)
      .map(item => item.event);
  }

  async getDailyHailContent(phrase?: string): Promise<StormData | null> {
    try {
      const events = await this.downloadAndParseCSV();
      
      const hailEvents = events.filter(event => 
        event.EVENT_TYPE.toLowerCase().includes('hail') &&
        parseFloat(event.MAGNITUDE) >= 2.0
      );
      
      if (hailEvents.length === 0) {
        console.log('No hail events >= 2.0" found in OKC metro from CSV');
        return null;
      }
      
      const today = new Date().toDateString();
      const dayHash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const eventIndex = dayHash % hailEvents.length;
      
      return this.convertCSVEventToStormData(hailEvents[eventIndex]);
      
    } catch (error) {
      console.error('Error getting daily hail content:', error);
      return null;
    }
  }

  async getDailyHailContentWithTrends(phrase?: string): Promise<StormData | null> {
    try {
      const events = await this.downloadAndParseCSV();
      
      // Filter for hail events in the last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      const hailEvents = events.filter(event => {
        if (!event.EVENT_TYPE.toLowerCase().includes('hail')) return false;
        if (parseFloat(event.MAGNITUDE) < 2.0) return false;
        
        try {
          const eventDate = new Date(event.BEGIN_DATE_TIME);
          return eventDate >= twelveMonthsAgo;
        } catch {
          return false;
        }
      });
      
      if (hailEvents.length === 0) {
        console.log('No hail events >= 2.0" found in OKC metro from past 12 months');
        return null;
      }
      
      // Get trending phrases and match them to events
      const trendingPhrases = this.loadTrendingPhrases();
      const matchedEvents = this.matchPhrasesToEvents(trendingPhrases, hailEvents);
      
      // Use best matched event or daily rotation fallback
      const selectedEvent = matchedEvents.length > 0 ? matchedEvents[0] : hailEvents[0];
      
      console.log(`Selected hail event from ${selectedEvent.BEGIN_DATE_TIME} with magnitude ${selectedEvent.MAGNITUDE}"`);
      return this.convertCSVEventToStormData(selectedEvent);
      
    } catch (error) {
      console.error('Error getting trending hail content:', error);
      return null;
    }
  }

  async getTornadoContent(): Promise<StormData | null> {
    try {
      const events = await this.downloadAndParseCSV();
      
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

  async getTornadoContentWithTrends(): Promise<StormData | null> {
    try {
      const events = await this.downloadAndParseCSV();
      
      // Filter for tornado events from the past 14 days only
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
        console.log('No recent tornado events found in OKC metro from past 14 days');
        return null; // Don't show tornado page if no recent events
      }
      
      // Get trending phrases and match them to events  
      const trendingPhrases = this.loadTrendingPhrases();
      const matchedEvents = this.matchPhrasesToEvents(trendingPhrases, tornadoEvents);
      
      // Use best matched event or most recent
      const selectedEvent = matchedEvents.length > 0 ? matchedEvents[0] : 
        tornadoEvents.sort((a, b) => new Date(b.BEGIN_DATE_TIME).getTime() - new Date(a.BEGIN_DATE_TIME).getTime())[0];
      
      console.log(`Selected tornado event from ${selectedEvent.BEGIN_DATE_TIME}`);
      return this.convertCSVEventToStormData(selectedEvent);
      
    } catch (error) {
      console.error('Error getting trending tornado content:', error);
      return null;
    }
  }

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

  private toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
}

export const stormDataService = new StormDataService();