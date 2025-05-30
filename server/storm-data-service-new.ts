import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as https from 'https';

interface StormEvent {
  event_type: string;
  state: string;
  cz_name: string;
  begin_location: string;
  magnitude: number;
  begin_date: string;
  end_date: string;
  event_narrative: string;
}

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

export class StormDataService {
  // OKC Metro area cities for location matching
  private readonly OKC_METRO_CITIES = [
    'oklahoma city', 'edmond', 'norman', 'moore', 'midwest city',
    'yukon', 'del city', 'bethany', 'mustang', 'nichols hills', 'warr acres'
  ];

  private csvCacheFile = path.join(process.cwd(), 'storm_events_cache.json');
  private lastCsvDownload = 0;
  private csvRefreshInterval = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    console.log('Storm Data Service initialized with NOAA CSV data source');
  }

  /**
   * Download and parse the latest NOAA storm events CSV
   */
  async downloadLatestStormCSV(): Promise<StormEvent[]> {
    const currentTime = Date.now();
    
    // Check if we have recent cached data
    if (fs.existsSync(this.csvCacheFile) && 
        (currentTime - this.lastCsvDownload) < this.csvRefreshInterval) {
      console.log('Using cached storm data');
      const cached = JSON.parse(fs.readFileSync(this.csvCacheFile, 'utf8'));
      return cached.events || [];
    }

    console.log('Downloading latest NOAA storm events CSV...');
    
    try {
      // Download the latest CSV file (2024 data)
      const csvUrl = 'https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/StormEvents_details-ftp_v1.0_d2024_c20241130.csv.gz';
      
      const csvData = await this.downloadFile(csvUrl);
      const decompressed = zlib.gunzipSync(csvData);
      const csvText = decompressed.toString('utf8');
      
      // Parse CSV and filter for Oklahoma events
      const events = this.parseStormCSV(csvText);
      
      // Cache the results
      fs.writeFileSync(this.csvCacheFile, JSON.stringify({
        events,
        downloadTime: currentTime
      }));
      
      this.lastCsvDownload = currentTime;
      console.log(`Parsed ${events.length} storm events from CSV`);
      
      return events;
      
    } catch (error) {
      console.error('Error downloading CSV:', error);
      // Try to use cached data if available
      if (fs.existsSync(this.csvCacheFile)) {
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
          reject(new Error(`HTTP ${response.statusCode}`));
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
   * Parse storm events CSV and filter for OKC metro
   */
  private parseStormCSV(csvText: string): StormEvent[] {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').toLowerCase());
    
    const events: StormEvent[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      if (values.length < headers.length) continue;
      
      const event: any = {};
      headers.forEach((header, index) => {
        event[header] = values[index] ? values[index].replace(/"/g, '') : '';
      });
      
      // Filter for Oklahoma events
      if (event.state !== 'OKLAHOMA') continue;
      
      // Filter for hail or tornado events
      const eventType = event.event_type?.toLowerCase();
      if (!eventType || (!eventType.includes('hail') && !eventType.includes('tornado'))) continue;
      
      // Check if in OKC metro area
      const location = (event.cz_name || event.begin_location || '').toLowerCase();
      const isInMetro = this.OKC_METRO_CITIES.some(city => 
        location.includes(city.toLowerCase())
      );
      
      if (!isInMetro) continue;
      
      // Parse magnitude for hail events
      let magnitude = 0;
      if (event.magnitude) {
        magnitude = parseFloat(event.magnitude) || 0;
      }
      
      // For hail, only include >= 2.0 inch events
      if (eventType.includes('hail') && magnitude < 2.0) continue;
      
      events.push({
        event_type: event.event_type || '',
        state: event.state || '',
        cz_name: event.cz_name || '',
        begin_location: event.begin_location || '',
        magnitude: magnitude,
        begin_date: event.begin_date || '',
        end_date: event.end_date || '',
        event_narrative: event.event_narrative || ''
      });
    }
    
    return events;
  }

  /**
   * Parse CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
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
      const events = await this.downloadLatestStormCSV();
      
      // Filter for hail events
      const hailEvents = events.filter(event => 
        event.event_type.toLowerCase().includes('hail') && 
        event.magnitude >= 2.0
      );
      
      if (hailEvents.length === 0) {
        console.log('No verified hail events ≥2" found in OKC metro');
        return null;
      }
      
      // Daily rotation based on current date
      const today = new Date().toDateString();
      const dayIndex = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const eventIndex = dayIndex % hailEvents.length;
      
      return this.convertCSVEventToStormData(hailEvents[eventIndex]);
      
    } catch (error) {
      console.error('Error getting daily hail content:', error);
      return null;
    }
  }

  /**
   * Get tornado damage content from CSV data  
   */
  async getTornadoContent(): Promise<StormData | null> {
    try {
      const events = await this.downloadLatestStormCSV();
      
      // Filter for recent tornado events (within 14 days)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const tornadoEvents = events.filter(event => {
        if (!event.event_type.toLowerCase().includes('tornado')) return false;
        
        const eventDate = new Date(event.begin_date);
        return eventDate >= twoWeeksAgo;
      });
      
      if (tornadoEvents.length === 0) {
        console.log('No recent tornado events found in OKC metro');
        return null;
      }
      
      // Return most recent tornado event
      tornadoEvents.sort((a, b) => new Date(b.begin_date).getTime() - new Date(a.begin_date).getTime());
      return this.convertCSVEventToStormData(tornadoEvents[0]);
      
    } catch (error) {
      console.error('Error getting tornado content:', error);
      return null;
    }
  }

  /**
   * Convert CSV storm event to StormData format
   */
  private convertCSVEventToStormData(event: StormEvent): StormData {
    const cityName = this.extractCityFromLocation(event.cz_name || event.begin_location);
    const hailSize = event.magnitude > 0 ? `${event.magnitude}"` : '2.5"';
    
    return {
      date_of_loss: this.formatDate(event.begin_date),
      affected_city: cityName,
      storm_type: event.event_type.toLowerCase().includes('hail') ? 'hail' : 'tornado',
      hail_size: hailSize,
      is_hail_event: event.event_type.toLowerCase().includes('hail'),
      is_tornado_event: event.event_type.toLowerCase().includes('tornado'),
      hail_less_than_1_5: event.magnitude < 1.5,
      event_details: event.event_narrative || `${event.event_type} event in ${cityName}`,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Extract city name from location string
   */
  private extractCityFromLocation(location: string): string {
    if (!location) return 'Oklahoma City';
    
    const cleanLocation = location.toLowerCase();
    
    for (const city of this.OKC_METRO_CITIES) {
      if (cleanLocation.includes(city)) {
        return this.toTitleCase(city);
      }
    }
    
    // Default fallback
    return 'Oklahoma City';
  }

  /**
   * Format date string for display
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
}

export const stormDataService = new StormDataService();