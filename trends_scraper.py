#!/usr/bin/env python3
"""
Google Trends scraper for storm-related search phrases
Generates trending phrases without requiring API keys
"""

from pytrends.request import TrendReq
import json
import time
import random

def fetch_trending_phrases():
    """Fetch trending search phrases from Google Trends"""
    try:
        # Initialize pytrends with random delay to avoid rate limiting
        time.sleep(random.uniform(1, 3))
        pytrends = TrendReq(hl='en-US', tz=360, timeout=(10,25), retries=2, backoff_factor=0.1)
        
        # Get trending searches for United States
        trending_data = pytrends.trending_searches(pn='united_states')
        
        # Convert to list and filter for storm-related phrases
        all_phrases = trending_data[0].tolist()
        
        # Filter for storm/weather/roofing related phrases
        storm_keywords = [
            'storm', 'hail', 'tornado', 'roof', 'damage', 'repair', 
            'insurance', 'weather', 'oklahoma', 'wind', 'claim',
            'contractor', 'emergency', 'restoration', 'leak'
        ]
        
        storm_phrases = []
        for phrase in all_phrases:
            phrase_lower = phrase.lower()
            if any(keyword in phrase_lower for keyword in storm_keywords):
                storm_phrases.append(phrase)
        
        # Always include base storm phrases even if not trending
        base_phrases = [
            'hail damage roof oklahoma',
            'tornado damage repair',
            'storm damage roofing oklahoma city',
            'roof repair after hail',
            'emergency roof contractor oklahoma',
            'insurance claim roof damage',
            'hail storm oklahoma city',
            'tornado damage assessment'
        ]
        
        # Combine trending and base phrases
        all_storm_phrases = list(set(storm_phrases + base_phrases))
        
        # Cache the results
        cache_data = {
            'phrases': all_storm_phrases,
            'trending_count': len(storm_phrases),
            'total_phrases': len(all_phrases),
            'generated_at': time.time(),
            'last_update': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        with open('trending_phrases.json', 'w') as f:
            json.dump(cache_data, f, indent=2)
        
        print(f"✓ Generated {len(all_storm_phrases)} storm-related phrases")
        print(f"✓ Found {len(storm_phrases)} trending storm phrases")
        
        return all_storm_phrases
        
    except Exception as error:
        print(f"Error fetching trends: {error}")
        
        # Return fallback phrases if trending fetch fails
        fallback_phrases = [
            'hail damage roof oklahoma',
            'tornado damage repair oklahoma',
            'storm damage roofing oklahoma city',
            'roof repair after hail storm',
            'emergency roof contractor oklahoma',
            'insurance claim roof damage',
            'hail storm damage oklahoma city',
            'tornado damage assessment oklahoma'
        ]
        
        cache_data = {
            'phrases': fallback_phrases,
            'trending_count': 0,
            'total_phrases': len(fallback_phrases),
            'generated_at': time.time(),
            'last_update': time.strftime('%Y-%m-%d %H:%M:%S'),
            'error': str(error)
        }
        
        with open('trending_phrases.json', 'w') as f:
            json.dump(cache_data, f, indent=2)
        
        print(f"✓ Using {len(fallback_phrases)} fallback storm phrases")
        return fallback_phrases

if __name__ == '__main__':
    fetch_trending_phrases()