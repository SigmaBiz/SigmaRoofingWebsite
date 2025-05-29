import fetch from 'node-fetch';

interface NOAAStormEvent {
  event_id: string;
  state: string;
  county: string;
  event_type: string;
  begin_date: string;
  end_date: string;
  magnitude: number | null;
  magnitude_type: string | null;
  category: string | null;
  location: string;
  source: string;
  episode_narrative: string;
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
  private baseUrl = 'https://www.ncdc.noaa.gov/stormevents/json';
  
  constructor() {
    console.log('Storm Data Service initialized');
  }

  /**
   * Get recent storm events in Oklahoma from NOAA Storm Events Database
   */
  async getRecentOklahomaStorms(daysBack: number = 30): Promise<NOAAStormEvent[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      
      const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
      const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
      
      // NOAA Storm Events API parameters
      const params = new URLSearchParams({
        dataset: 'details',
        startdate: startDateStr,
        enddate: endDateStr,
        state: 'OK', // Oklahoma
        format: 'json',
        limit: '1000'
      });

      const url = `${this.baseUrl}?${params}`;
      console.log('Fetching storm data from NOAA:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`NOAA API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      if (!data.results || !Array.isArray(data.results)) {
        console.log('No storm events found in response');
        return [];
      }
      
      console.log(`Found ${data.results.length} storm events in Oklahoma`);
      return data.results;
      
    } catch (error) {
      console.error('Error fetching storm data from NOAA:', error);
      throw error;
    }
  }

  /**
   * Process storm events and find the most relevant recent event
   */
  async getLatestRelevantStorm(): Promise<StormData | null> {
    try {
      const storms = await this.getRecentOklahomaStorms(14); // Last 2 weeks
      
      if (storms.length === 0) {
        console.log('No recent storms found');
        return null;
      }

      // Filter for relevant storm types (hail, tornado, high wind)
      const relevantStorms = storms.filter(storm => {
        const eventType = storm.event_type?.toLowerCase() || '';
        return eventType.includes('hail') || 
               eventType.includes('tornado') || 
               eventType.includes('wind') ||
               eventType.includes('thunderstorm');
      });

      if (relevantStorms.length === 0) {
        console.log('No relevant storm types found');
        return null;
      }

      // Sort by date and get the most recent
      const sortedStorms = relevantStorms.sort((a, b) => 
        new Date(b.begin_date).getTime() - new Date(a.begin_date).getTime()
      );

      const latestStorm = sortedStorms[0];
      console.log('Processing latest storm:', latestStorm.event_type, latestStorm.begin_date);

      return this.processStormEvent(latestStorm);
      
    } catch (error) {
      console.error('Error processing storm data:', error);
      return null;
    }
  }

  /**
   * Convert NOAA storm event to our template variables
   */
  private processStormEvent(event: NOAAStormEvent): StormData {
    const eventType = event.event_type?.toLowerCase() || '';
    const location = event.location || event.county || 'Oklahoma';
    
    // Extract city from location string (often formatted as "CITY NAME" or "COUNTY")
    let city = location.split(/[,\(\)]/)[0].trim();
    city = this.toTitleCase(city);
    
    // Determine storm type
    let stormType = 'severe weather';
    if (eventType.includes('hail')) {
      stormType = 'hailstorm';
    } else if (eventType.includes('tornado')) {
      stormType = 'tornado';
    } else if (eventType.includes('wind')) {
      stormType = 'windstorm';
    } else if (eventType.includes('thunderstorm')) {
      stormType = 'severe thunderstorm';
    }

    // Extract hail size if available
    let hailSize = '';
    let hailSizeInches = 0;
    if (event.magnitude && event.magnitude_type?.toLowerCase().includes('hail')) {
      hailSizeInches = event.magnitude;
      hailSize = `${event.magnitude}"`;
    }

    const isHailEvent = eventType.includes('hail');
    const isTornadoEvent = eventType.includes('tornado') || eventType.includes('wind');
    const hailLessThan1_5 = hailSizeInches > 0 && hailSizeInches < 1.5;

    // Format date
    const date = new Date(event.begin_date);
    const dateOfLoss = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return {
      date_of_loss: dateOfLoss,
      affected_city: city,
      storm_type: stormType,
      hail_size: hailSize,
      is_hail_event: isHailEvent,
      is_tornado_event: isTornadoEvent,
      hail_less_than_1_5: hailLessThan1_5,
      event_details: event.event_narrative || event.episode_narrative || '',
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Convert string to title case
   */
  private toTitleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const storms = await this.getRecentOklahomaStorms(7);
      console.log(`API test successful - found ${storms.length} storm events`);
      return true;
    } catch (error) {
      console.error('API test failed:', error);
      return false;
    }
  }
}

export const stormDataService = new StormDataService();