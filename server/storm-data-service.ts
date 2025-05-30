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
  
  // OKC Metro area definition per requirements
  private readonly OKC_METRO_CITIES = [
    'oklahoma city', 'edmond', 'norman', 'moore', 'midwest city',
    'yukon', 'del city', 'bethany', 'mustang', 'nichols hills', 'warr acres'
  ];

  constructor() {
    console.log('Storm Data Service initialized');
  }

  /**
   * Get daily hail content with rotation - only verified NOAA storms ≥2"
   */
  async getDailyHailContent(phrase?: string): Promise<StormData | null> {
    try {
      // Get NOAA storm events from past 9 months
      const storms = await this.getRecentOklahomaStorms(270);
      
      // Filter for hail events ≥2" in OKC metro
      const validHailStorms = storms.filter(storm => {
        const eventType = storm.event_type?.toLowerCase() || '';
        if (!eventType.includes('hail')) return false;
        
        const hailSize = this.extractHailSize(storm);
        if (hailSize < 2.0) return false;
        
        return this.isInOKCMetro(storm);
      });
      
      if (validHailStorms.length === 0) {
        console.log('No verified NOAA hail events ≥2" found in OKC metro');
        return null;
      }
      
      // If phrase provided, try to match it first
      if (phrase) {
        const matchingStorm = validHailStorms.find(storm => 
          this.phraseMatchesStorm(phrase, storm)
        );
        if (matchingStorm) {
          return this.processStormEvent(matchingStorm);
        }
      }
      
      // Daily rotation - use current date as seed for consistent daily selection
      const today = new Date().toDateString();
      const dayIndex = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const stormIndex = dayIndex % validHailStorms.length;
      
      return this.processStormEvent(validHailStorms[stormIndex]);
      
    } catch (error) {
      console.error('Error getting daily hail content:', error);
      return null;
    }
  }

  /**
   * Check if storm is in OKC metro area
   */
  private isInOKCMetro(storm: NOAAStormEvent): boolean {
    const location = (storm.location || '').toLowerCase();
    
    return this.OKC_METRO_CITIES.some(city => 
      location.includes(city) || location.includes(city.replace(' ', ''))
    );
  }

  /**
   * Extract hail size from NOAA storm data
   */
  private extractHailSize(storm: NOAAStormEvent): number {
    // Check magnitude field first
    if (storm.magnitude && storm.magnitude_type?.toLowerCase().includes('inches')) {
      return storm.magnitude;
    }
    
    // Extract from narrative
    const narrative = storm.event_narrative || '';
    const sizeMatch = narrative.toLowerCase().match(/(\d+\.?\d*)\s*inch/);
    if (sizeMatch) {
      return parseFloat(sizeMatch[1]) || 0;
    }
    
    return 0;
  }

  /**
   * Check if phrase matches storm event
   */
  private phraseMatchesStorm(phrase: string, storm: NOAAStormEvent): boolean {
    const lowerPhrase = phrase.toLowerCase();
    const location = (storm.location || '').toLowerCase();
    
    const hasHailTerms = lowerPhrase.includes('hail') || 
                        lowerPhrase.includes('storm') || 
                        lowerPhrase.includes('damage');
    
    const hasLocationMatch = this.OKC_METRO_CITIES.some(city => 
      lowerPhrase.includes(city) || location.includes(city)
    );
    
    return hasHailTerms && hasLocationMatch;
  }

  /**
   * Get recent large hail events for "Other Events" section
   */
  async getRecentLargeHailEvents(): Promise<Array<{city: string, hail_size: string, date: string}> | null> {
    try {
      const storms = await this.getRecentOklahomaStorms(270); // 9 months
      
      const largeHailEvents = storms
        .filter(storm => {
          const eventType = storm.event_type?.toLowerCase() || '';
          if (!eventType.includes('hail')) return false;
          
          const hailSize = this.extractHailSize(storm);
          if (hailSize < 2.0) return false;
          
          return this.isInOKCMetro(storm);
        })
        .map(storm => ({
          city: this.extractCityName(storm.location),
          hail_size: `${this.extractHailSize(storm)}" diameter`,
          date: new Date(storm.begin_date).toLocaleDateString()
        }))
        .slice(0, 5); // Limit to 5 events as requested
      
      return largeHailEvents.length > 0 ? largeHailEvents : null;
    } catch (error) {
      console.error('Error getting recent large hail events:', error);
      return null;
    }
  }

  /**
   * Extract city name from location string
   */
  private extractCityName(location: string): string {
    if (!location) return 'Oklahoma City';
    
    // Find matching metro city
    const matchedCity = this.OKC_METRO_CITIES.find(city =>
      location.toLowerCase().includes(city)
    );
    
    if (matchedCity) {
      return matchedCity.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    // Extract first part before comma/parentheses
    const cityMatch = location.split(/[,()]/)[0].trim();
    return cityMatch || 'Oklahoma City';
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