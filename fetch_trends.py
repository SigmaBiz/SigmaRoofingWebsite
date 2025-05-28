#!/usr/bin/env python3
"""
Google Trends fetcher for roofing-related search terms in Oklahoma
Generates dynamic landing page data based on trending searches
"""

import json
import re
from datetime import datetime, timedelta
from pytrends.request import TrendReq
import pandas as pd

# Initialize pytrends
pytrends = TrendReq(hl='en-US', tz=360)

def fetch_roofing_trends():
    """Fetch trending roofing-related keywords for Oklahoma"""
    
    # Roofing-related keywords to track
    roofing_keywords = [
        'roof damage oklahoma',
        'hail damage roof',
        'storm damage roof oklahoma',
        'roof inspection oklahoma',
        'tornado roof damage',
        'roof repair oklahoma city',
        'roof replacement edmond',
        'storm damage moore oklahoma',
        'hail damage norman oklahoma',
        'roof leak repair oklahoma'
    ]
    
    # Get interest over time for these keywords
    pytrends.build_payload(roofing_keywords, cat=0, timeframe='today 3-m', geo='US-OK')
    interest_over_time = pytrends.interest_over_time()
    
    if interest_over_time.empty:
        print("No trend data available")
        return []
    
    # Get the latest data (most recent week)
    latest_data = interest_over_time.iloc[-1]
    
    # Sort by interest level and get top 5
    top_trends = latest_data.drop('isPartial').sort_values(ascending=False).head(5)
    
    return list(top_trends.index)

def parse_phrase_to_variables(phrase, phrase_id):
    """Parse a search phrase into structured variables"""
    
    # City extraction patterns
    cities = ['oklahoma city', 'edmond', 'moore', 'norman', 'tulsa', 'broken arrow', 'yukon', 'mustang']
    city = 'Oklahoma City'  # Default
    
    for c in cities:
        if c.lower() in phrase.lower():
            city = c.title()
            break
    
    # Storm type detection
    storm_type = 'severe weather'  # Default
    if 'hail' in phrase.lower():
        storm_type = 'hailstorm'
    elif 'tornado' in phrase.lower():
        storm_type = 'tornado'
    elif 'wind' in phrase.lower():
        storm_type = 'windstorm'
    elif 'storm' in phrase.lower():
        storm_type = 'storm'
    
    # Hail size detection (if mentioned)
    hail_size = ''
    if 'golf ball' in phrase.lower() or 'golf-ball' in phrase.lower():
        hail_size = 'golf-ball'
    elif 'tennis ball' in phrase.lower() or 'tennis-ball' in phrase.lower():
        hail_size = 'tennis-ball'
    elif 'quarter' in phrase.lower():
        hail_size = 'quarter-sized'
    elif 'baseball' in phrase.lower():
        hail_size = 'baseball-sized'
    
    # Generate a recent storm date (within last 30 days)
    recent_date = datetime.now() - timedelta(days=7)
    storm_date = recent_date.strftime('%B %d, %Y')
    
    return {
        'phrase_id': phrase_id,
        'phrase': phrase,
        'city': city,
        'storm_type': storm_type,
        'storm_date': storm_date,
        'hail_size': hail_size,
        'generated_at': datetime.now().isoformat()
    }

def generate_trending_data():
    """Main function to generate trending roofing data"""
    
    print("Fetching trending roofing terms for Oklahoma...")
    
    try:
        trending_phrases = fetch_roofing_trends()
        
        if not trending_phrases:
            # Fallback to sample data if no trends available
            trending_phrases = [
                'roof damage oklahoma',
                'hail damage roof',
                'storm damage roof oklahoma',
                'roof inspection oklahoma',
                'tornado roof damage'
            ]
            print("Using sample phrases as fallback")
        
        print(f"Found {len(trending_phrases)} trending phrases")
        
        # Convert to structured data
        trending_data = {}
        
        for i, phrase in enumerate(trending_phrases, 1):
            phrase_id = f"{i:03d}"
            trending_data[phrase_id] = parse_phrase_to_variables(phrase, phrase_id)
            print(f"Generated entry {phrase_id}: {phrase}")
        
        # Save to JSON file
        with open('trending_phrases.json', 'w') as f:
            json.dump(trending_data, f, indent=2)
        
        print(f"\nSaved {len(trending_data)} entries to trending_phrases.json")
        
        # Display generated data
        print("\nGenerated trending data:")
        for phrase_id, data in trending_data.items():
            print(f"{phrase_id}: {data['phrase']} -> {data['city']}, {data['storm_type']}")
        
        return trending_data
        
    except Exception as e:
        print(f"Error fetching trends: {e}")
        print("This might be due to rate limiting or connection issues with Google Trends")
        return None

if __name__ == "__main__":
    generate_trending_data()