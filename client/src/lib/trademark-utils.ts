// Trademark compliance utility for roofing manufacturer brands

const trademarkMap: Record<string, string> = {
  // GAF Products - must use exact names from guidelines
  'GAF Timberline HDZ': 'GAF Timberline HDZ® Shingles',
  'Timberline HDZ': 'Timberline HDZ® Shingles',
  'GAF ArmorShield II': 'GAF ArmorShield™ II',
  'GAF Armorshield II': 'GAF ArmorShield™ II', // Fix common misspelling
  'GAF ArmorShield 2': 'GAF ArmorShield™ II',
  'GAF Armorshield 2': 'GAF ArmorShield™ II',
  'ArmorShield II': 'ArmorShield™ II',
  'ArmorShield 2': 'ArmorShield™ II',
  
  // CertainTeed Products
  'Certainteed Landmark': 'CertainTeed Landmark®',
  'CertainTeed Landmark': 'CertainTeed Landmark®',
  'Landmark Colonial Slate': 'Landmark® Colonial Slate',
  
  // Company trademarks
  'GAF': 'GAF®',
  'CertainTeed': 'CertainTeed®',
};

export function applyTrademarks(text: string): string {
  let result = text;
  
  // Sort by length (longest first) to avoid partial replacements
  const sortedTerms = Object.keys(trademarkMap).sort((a, b) => b.length - a.length);
  
  sortedTerms.forEach(term => {
    // Use word boundaries to avoid replacing parts of words
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    result = result.replace(regex, trademarkMap[term]);
  });
  
  return result;
}

// Validate project descriptions for compliance
export function validateProjectDescription(description: string): {
  isValid: boolean;
  issues: string[];
  corrected: string;
} {
  const issues: string[] = [];
  let corrected = description;
  
  // Check for missing trademark symbols
  const problematicTerms = [
    { pattern: /\bGAF\s+Timberline\s+HDZ\b(?!®)/gi, issue: 'Missing ® symbol after "Timberline HDZ"' },
    { pattern: /\bGAF\s+ArmorShield\s+(?:II|2)\b(?!™)/gi, issue: 'Missing ™ symbol after "ArmorShield"' },
    { pattern: /\bCertainTeed\s+Landmark\b(?!®)/gi, issue: 'Missing ® symbol after "Landmark"' },
  ];
  
  problematicTerms.forEach(({ pattern, issue }) => {
    if (pattern.test(description)) {
      issues.push(issue);
    }
  });
  
  // Apply corrections
  corrected = applyTrademarks(corrected);
  
  return {
    isValid: issues.length === 0,
    issues,
    corrected
  };
}

// Format product name for display with proper trademark
export function formatProductName(productName: string): string {
  return applyTrademarks(productName);
}