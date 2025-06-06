# Context 002: Image Persistence and GAF Compliance
**Date Range**: Early June 2025  
**Context Usage**: ~20-40%

## Overview
Major focus on fixing image persistence issues between Replit preview and live site (oksigma.com), implementing GAF trademark compliance, and discovering root causes of data loss.

## Key Accomplishments

### 1. Image Persistence Debugging
- Discovered images work on desktop but not mobile
- Created debugging tools to diagnose the issue:
  - `/client/src/components/debug-panel.tsx` - Shows API status and localStorage
  - `/client/src/components/data-sync.tsx` - Import/export tool for data transfer

### 2. Enhanced ImageService
- Modified `/client/src/lib/imageService.ts` to better handle API failures
- Added mobile detection and logging
- Implemented proper fallback to localStorage when API returns empty:
```typescript
if (data.success && data.images) {
  const hasValidImages = Object.values(data.images).some(value => value !== null && value !== undefined && value !== '');
  
  if (hasValidImages) {
    // Use API data
    return data.images;
  } else {
    console.log('[ImageService] API returned null/empty images, falling back to localStorage');
  }
}
```

### 3. GAF Trademark Compliance Implementation
- Created `/client/src/lib/trademark-utils.ts` for automatic trademark application
- Added `/client/src/components/trademark-disclaimer.tsx` footer disclaimer
- Created `/client/src/components/trademark-updater.tsx` tool for bulk updates
- Trademark mappings:
  - GAF → GAF®
  - CertainTeed → CertainTeed®
  - GAF ArmorShield II → GAF ArmorShield™ II
  - GAF Timberline HDZ → GAF Timberline HDZ® Shingles

### 4. Root Cause Discovery
- Identified `/server/storage.ts` uses `MemStorage` (in-memory storage)
- This doesn't persist between:
  - Server restarts
  - Different environments (Replit vs production)
  - Different domains
- This is the root cause of all persistence issues

## Problems Solved

### 1. Mobile Image Display
- **Problem**: No images showing on mobile devices
- **Investigation**: Created extensive debugging tools
- **Finding**: API returns empty data, localStorage partially populated
- **Workaround**: Enhanced fallback logic in imageService

### 2. Data Loss During Branch Switching
- **Problem**: Lost all project data when switching branches
- **Solution**: Created data export/import functionality
- **Recovery**: Extracted data from live site and restored

### 3. GAF Trademark Compliance
- **Problem**: Legal requirement to use proper trademark symbols
- **Solution**: Automated trademark application throughout the site
- **Implementation**: Utils for automatic correction + bulk updater tool

## Technical Discoveries

### 1. Storage Architecture Issues
```typescript
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contactRequests: Map<number, ContactRequest>;
  private projects: Map<number, Project>;
  private websiteImages: WebsiteImages | undefined;
  // ... all stored in memory only
}
```

### 2. API Behavior
- API endpoint `/api/website-images` returns 404 on production
- API returns success but empty data when memory is cleared
- localStorage persists per domain but not across environments

### 3. Mobile vs Desktop Differences
- Desktop: Can fallback to localStorage effectively
- Mobile: API calls fail differently, localStorage access varies by browser

## Data Restoration Scripts Created
1. Debug scripts to check image presence
2. Manual restoration scripts for localStorage
3. API sync attempts (often fail due to 403/404 errors)

## Key Files Modified
- `/client/src/lib/imageService.ts` - Enhanced fallback logic
- `/server/storage.ts` - Identified as root cause (not modified)
- `/client/src/lib/trademark-utils.ts` - New trademark utility
- `/client/src/components/trademark-disclaimer.tsx` - New disclaimer component
- `/client/src/components/trademark-updater.tsx` - New bulk updater tool
- `/client/src/components/data-sync.tsx` - New data import/export tool
- `/client/src/components/debug-panel.tsx` - New debugging panel

## Pending Issues at 40% Mark
- Need to implement proper database storage (PostgreSQL)
- Images still not persisting reliably between sessions
- Mobile display issues partially resolved but not fully fixed
- API endpoints return 404 on production deployment

## Critical Insight
The entire persistence problem stems from using in-memory storage. No amount of frontend fixes will solve this - the backend needs a proper database implementation.