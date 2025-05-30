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
  private spcBaseUrl = 'https://www.spc.noaa.gov/climo/reports/';
  
  // OKC Metro area definition per requirements
  private readonly OKC_METRO_CITIES = [
    'oklahoma city', 'edmond', 'norman', 'moore', 'midwest city',
    'yukon', 'del city', 'bethany', 'mustang', 'nichols hills', 'warr acres'
  ];

  constructor() {
    console.log('Storm Data Service initialized with SPC CSV access');
  }

  /**
   * Get daily hail content with rotation - only verified SPC hail reports ≥2"
   */
  async getDailyHailContent(phrase?: string): Promise<StormData | null> {
    try {
      // Get verified hail reports from past 9 months using SPC CSV data
      const hailReports = await this.getVerifiedHailReports(270);
      
      if (hailReports.length === 0) {
        console.log('No verified SPC hail reports ≥2" found in OKC metro');
        return null;
      }
      
      // If phrase provided, try to match it first
      if (phrase) {
        const matchingReport = hailReports.find(report => 
          this.phraseMatchesHailReport(phrase, report)
        );
        if (matchingReport) {
          return this.processHailReport(matchingReport);
        }
      }
      
      // Daily rotation - use current date as seed for consistent daily selection
      const today = new Date().toDateString();
      const dayIndex = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const reportIndex = dayIndex % hailReports.length;
      
      return this.processHailReport(hailReports[reportIndex]);
      
    } catch (error) {
      console.error('Error getting daily hail content:', error);
      return null;
    }
  }

  /**
   * Get verified hail reports from SPC CSV files
   */
  async getVerifiedHailReports(daysBack: number = 30): Promise<any[]> {
    const allReports: any[] = [];
    const endDate = new Date();
    
    // Check each day going back the specified number of days
    for (let i = 0; i < daysBack; i++) {
      const checkDate = new Date(endDate);
      checkDate.setDate(endDate.getDate() - i);
      
      try {
        const reports = await this.getHailReportsForDate(checkDate);
        allReports.push(...reports);
      } catch (error) {
        // Continue checking other dates if one fails
        console.log(`No hail data for ${checkDate.toISOString().split('T')[0]}`);
      }
    }
    
    return allReports;
  }

  /**
   * Get hail reports for a specific date from SPC CSV
   */
  async getHailReportsForDate(date: Date): Promise<any[]> {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const url = `${this.spcBaseUrl}${dateStr}_rpts_hail.csv`;
    
    try {
      console.log(`Fetching SPC hail data: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`SPC CSV request failed: ${response.status}`);
      }
      
      const csvText = await response.text();
      const reports = this.parseHailCSV(csvText, date);
      
      // Filter for OKC metro and ≥2" hail
      return reports.filter(report => 
        this.isHailReportInOKCMetro(report) && 
        parseFloat(report.size) >= 2.0
      );
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Parse SPC hail CSV data
   */
  private parseHailCSV(csvText: string, date: Date): any[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Skip header line and parse data
    return lines.slice(1).map(line => {
      const columns = line.split(',');
      if (columns.length < 6) return null;
      
      return {
        date: date.toLocaleDateString(),
        time: columns[0]?.trim() || '',
        size: columns[1]?.trim() || '0',
        location: columns[2]?.trim() || '',
        county: columns[3]?.trim() || '',
        state: columns[4]?.trim() || '',
        comments: columns[5]?.trim() || ''
      };
    }).filter(report => report !== null);
  }

  /**
   * Check if hail report is in OKC metro area
   */
  private isHailReportInOKCMetro(report: any): boolean {
    const location = (report.location || '').toLowerCase();
    const county = (report.county || '').toLowerCase();
    
    // Check if in Oklahoma
    if (report.state !== 'OK') return false;
    
    // Check for metro cities
    return this.OKC_METRO_CITIES.some(city => 
      location.includes(city) || 
      location.includes(city.replace(' ', '')) ||
      county.includes(city.split(' ')[0])
    );
  }

  /**
   * Check if phrase matches hail report
   */
  private phraseMatchesHailReport(phrase: string, report: any): boolean {
    const lowerPhrase = phrase.toLowerCase();
    const location = (report.location || '').toLowerCase();
    
    const hasHailTerms = lowerPhrase.includes('hail') || 
                        lowerPhrase.includes('storm') || 
                        lowerPhrase.includes('damage');
    
    const hasLocationMatch = this.OKC_METRO_CITIES.some(city => 
      lowerPhrase.includes(city) || location.includes(city)
    );
    
    return hasHailTerms && hasLocationMatch;
  }

  /**
   * Process hail report into StormData format
   */
  private processHailReport(report: any): StormData {
    const city = this.extractCityFromLocation(report.location);
    const hailSize = parseFloat(report.size) || 2.0;
    
    return {
      date_of_loss: report.date,
      affected_city: city,
      storm_type: 'hail',
      hail_size: `${hailSize}"`,
      is_hail_event: true,
      is_tornado_event: false,
      hail_less_than_1_5: hailSize < 1.5,
      event_details: `${hailSize}" hail reported in ${city} on ${report.date}`,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Extract city name from SPC location format
   */
  private extractCityFromLocation(location: string): string {
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
    
    // Extract location before any direction indicators
    const cityMatch = location.split(/\s+(N|S|E|W|NE|NW|SE|SW)\s+/)[0].trim();
    return cityMatch || 'Oklahoma City';
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
   * Get recent large hail events for "Other Events" section using SPC data
   */
  async getRecentLargeHailEvents(): Promise<Array<{city: string, hail_size: string, date: string}> | null> {
    try {
      const hailReports = await this.getVerifiedHailReports(270); // 9 months
      
      const largeHailEvents = hailReports
        .map(report => ({
          city: this.extractCityFromLocation(report.location),
          hail_size: `${parseFloat(report.size)}" diameter`,
          date: report.date
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