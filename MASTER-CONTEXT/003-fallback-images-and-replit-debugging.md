# Context 003: Fallback Images and Replit Debugging
**Date Range**: June 6, 2025  
**Context Usage**: ~40-60%

## Overview
Focused on replacing all generic Unsplash placeholder images with actual Sigma Roofing images and debugging Replit deployment issues.

## Key Accomplishments

### 1. Complete Fallback Image Replacement
Systematically replaced ALL generic Unsplash images with real Cloudinary-hosted images throughout the codebase.

#### Hero Background CSS
- File: `/client/src/index.css` (line 120)
- Old: `https://images.unsplash.com/photo-1558618666-fcd25c85cd64`
- New: `https://res.cloudinary.com/dkcmw0iji/image/upload/v1748734928/sigma-roofing/projects/ojrrai753uqfnzlknbv1.jpg`

#### Projects Component Static Data
- File: `/client/src/components/projects.tsx`
- Replaced entire `staticProjects` array with 6 real projects:
  1. Complete Roof Replacement - Nichols Hills (GAF® Timberline HDZ®)
  2. Hail Damage Repair - Nichols Hills (GAF® products)
  3. Storm Damage Restoration - Oklahoma City
  4. New Construction - Nichols Hills
  5. Insurance Claim Assistance - Oklahoma City
  6. Complete Roof Replacement - Edmond (GAF® certified)
- All projects include proper GAF® and CertainTeed® trademark compliance

#### Services Component Fallbacks
- File: `/client/src/components/services.tsx`
- Added `fallbackImage` property to each service:
```typescript
{
  title: "Roof Inspection",
  description: "Comprehensive roof assessments...",
  imageKey: "serviceInspection",
  fallbackImage: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748388948/sigma-roofing/services/j2c88nkkgmrcfm0r1h9w.png"
}
```

#### About Component Images
- File: `/client/src/components/about.tsx`
- Team photo: `https://res.cloudinary.com/dkcmw0iji/image/upload/v1748389526/sigma-roofing/projects/rfwxm4ysfg1nsi9yumde.jpg`
- Vision image: `https://res.cloudinary.com/dkcmw0iji/image/upload/v1748379461/sigma-roofing/projects/cc9tl1zez7eibeog2uvt.png`

#### Dynamic Landing Page
- File: `/client/src/pages/dynamic-landing.tsx`
- Updated error handler fallback
- Updated static projects array

### 2. Text Content Updates
- Changed project gallery description from:
  - "Custom project gallery showcasing our latest roofing work managed through your admin panel."
- To:
  - "Custom project gallery showcasing our latest work."

### 3. Data Restoration Scripts Created

#### verify-and-set-images.js
- Checks for missing images in localStorage
- Sets individual images from JSON export
- Reports status of each image

#### restore-projects-from-json.js
- Restores 6 projects from JSON export
- Applies GAF® trademark compliance
- Syncs to API if available

#### restore-all-data.js
- Complete restoration solution:
```javascript
// Restores all images
const images = {
  heroBackground: "https://res.cloudinary.com/...",
  serviceInspection: "https://res.cloudinary.com/...",
  // ... all 10 images
};

// Restores all projects with trademark compliance
const projects = [...]; // 6 projects

// Auto-refreshes page after restoration
setTimeout(() => location.reload(), 1000);
```

### 4. Replit Debugging Journey

#### Problem Timeline:
1. User reported "the app crashed" after trying to restart
2. Found TypeScript error in `storm-data-service-clean.ts`
3. Fixed duplicate method code and syntax errors
4. Server started but "stuck in loading"
5. Discovered localStorage was cleared
6. Changed server binding and port configuration

#### Technical Fixes Applied:

##### 1. Storm Data Service Fix
- File: `/server/storm-data-service-clean.ts`
- Issue: Duplicate `matchPhrasesToEvents` method and extra closing brace
- Resolution: Removed duplicate code, fixed syntax

##### 2. Server Binding Change
- File: `/server/index.ts`
- Changed from: `server.listen(port, '127.0.0.1', ...)`
- Changed to: `server.listen(port, '0.0.0.0', ...)`
- Reason: Replit requires 0.0.0.0 for external access

##### 3. Port Configuration
- File: `.replit`
- Updated `[[ports]]` from 5000 to 3000
- Updated `waitForPort` in workflow from 5000 to 3000

#### Current Status:
- Server running successfully on port 3000
- Build completed without errors
- Replit webview stuck loading (proxy issue)
- Solution: User needs to open URL directly in new tab

## Three-Tier Fallback System Achieved

1. **Primary**: API/Database (when implemented)
2. **Secondary**: localStorage (per-domain persistence)
3. **Tertiary**: Hardcoded real images in source code

This ensures professional content displays even with:
- Complete API failure
- Cleared localStorage
- Fresh deployments
- New domains/environments

## Technical Insights

### Why Replit Preview Gets Stuck
1. Webview uses proxy that may cache old port configurations
2. Binding change from 127.0.0.1 to 0.0.0.0 requires proxy refresh
3. Port changes (5000 → 3000) not always reflected immediately

### localStorage Behavior
- Cleared when switching Replit branches
- Domain-specific (different between preview and custom domain)
- Persists within same domain/session
- Not synchronized between environments

## Files Modified Summary
- `/client/src/index.css` - Hero background
- `/client/src/components/projects.tsx` - Static projects & fallback
- `/client/src/components/services.tsx` - Service fallbacks
- `/client/src/components/about.tsx` - About section images
- `/client/src/pages/dynamic-landing.tsx` - Landing page fallbacks
- `/server/storm-data-service-clean.ts` - TypeScript fixes
- `/server/index.ts` - Server binding
- `/.replit` - Port configuration

## Scripts Created
- `verify-and-set-images.js`
- `restore-projects-from-json.js`
- `restore-all-data.js`

## Pending at 60% Mark
- Replit preview still loading (user needs to open direct URL)
- Need to run restore-all-data.js once site accessible
- Database implementation still pending (root cause of persistence issues)

## Additional Debugging Efforts (60-80% Context)

### Text Update Issue
Despite updating the code to show "Custom project gallery showcasing our latest work." (removing "managed through your admin panel"), the old text persists even after:

1. **Multiple rebuilds** - Confirmed built files contain correct text
2. **Cache clearing** - Removed all Vite caches, dist folder
3. **Service worker removal** - Found and unregistered Replit service worker
4. **Browser cache clearing** - Tried incognito/private windows
5. **Server restarts** - Killed all processes, fresh starts
6. **Production mode** - Ran server in production mode with built files

#### Investigation Results:
- Source code in `/client/src/components/projects.tsx` line 198 shows correct text
- Built file `dist/public/assets/index-BU_o1wcN.js` contains correct text
- React component receives old text as props (confirmed via React DevTools)
- Text not found in any loaded scripts
- Clearing service worker temporarily fixed it but reverted after data restore

#### Current State:
- Text still shows: "Custom project gallery showcasing our latest roofing work managed through your admin panel."
- Should show: "Custom project gallery showcasing our latest work."
- All other changes (fallback images, GAF® compliance) working correctly

### Replit Preview Fix
- Changed server binding from 127.0.0.1 to 0.0.0.0
- Updated .replit port configuration from 5000 to 3000
- Preview eventually started working after multiple attempts
- Direct URL access: `https://3d343fd7-5134-4df6-916f-8af6121a6932-00-277p50kgvjf6.spock.replit.dev`