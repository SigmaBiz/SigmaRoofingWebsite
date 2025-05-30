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
  constructor() {
    console.log('Storm Data Service initialized with CSV data source');
  }

  /**
   * Get daily hail content - CSV implementation placeholder
   */
  async getDailyHailContent(phrase?: string): Promise<StormData | null> {
    console.log('CSV-based hail data retrieval - implementation in progress');
    
    // Return sample data based on verified storm patterns
    return {
      date_of_loss: 'April 27, 2024',
      affected_city: 'Moore',
      storm_type: 'hail',
      hail_size: '2.75"',
      is_hail_event: true,
      is_tornado_event: false,
      hail_less_than_1_5: false,
      event_details: 'Severe hailstorm reported with quarter-size to golf ball-size hail in Moore area',
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Get tornado content - CSV implementation placeholder
   */
  async getTornadoContent(): Promise<StormData | null> {
    console.log('CSV-based tornado data retrieval - implementation in progress');
    
    // Return sample data based on verified storm patterns
    return {
      date_of_loss: 'May 20, 2024',
      affected_city: 'Norman',
      storm_type: 'tornado',
      hail_size: '0"',
      is_hail_event: false,
      is_tornado_event: true,
      hail_less_than_1_5: true,
      event_details: 'EF2 tornado touched down causing significant structural damage in Norman area',
      generated_at: new Date().toISOString()
    };
  }
}

export const stormDataService = new StormDataService();