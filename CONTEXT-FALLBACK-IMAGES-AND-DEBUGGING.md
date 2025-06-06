# Context: Fallback Images Update & Replit Debugging

## Date: June 6, 2025

### 1. Fallback Images Update

We successfully updated all generic Unsplash placeholder images to use actual Sigma Roofing images as fallbacks throughout the codebase.

#### Changes Made:

1. **Hero Background CSS** (`client/src/index.css`):
   - Changed from: `https://images.unsplash.com/photo-1558618666-fcd25c85cd64`
   - Changed to: `https://res.cloudinary.com/dkcmw0iji/image/upload/v1748734928/sigma-roofing/projects/ojrrai753uqfnzlknbv1.jpg`

2. **Projects Component** (`client/src/components/projects.tsx`):
   - Replaced all 6 static project fallbacks with actual project data
   - Added GAF® and CertainTeed® trademark compliance
   - Fallback image changed to first project image

3. **Services Component** (`client/src/components/services.tsx`):
   - Added `fallbackImage` property to each service object
   - Updated ServiceCard to use `serviceImages[service.imageKey] || service.fallbackImage`
   - All 6 services now have actual Cloudinary images as fallbacks

4. **About Component** (`client/src/components/about.tsx`):
   - Team photo fallback: `https://res.cloudinary.com/dkcmw0iji/image/upload/v1748389526/sigma-roofing/projects/rfwxm4ysfg1nsi9yumde.jpg`
   - Vision image fallback: `https://res.cloudinary.com/dkcmw0iji/image/upload/v1748379461/sigma-roofing/projects/cc9tl1zez7eibeog2uvt.png`

5. **Dynamic Landing Page** (`client/src/pages/dynamic-landing.tsx`):
   - Updated static projects array with real projects
   - Changed error handler fallback image

#### Text Update:
- Changed "Custom project gallery showcasing our latest roofing work managed through your admin panel."
- To: "Custom project gallery showcasing our latest work."

### 2. Data Restoration Scripts

Created several scripts to restore data when localStorage is cleared:

1. **verify-and-set-images.js** - Checks and restores individual images
2. **restore-projects-from-json.js** - Restores projects with trademark compliance
3. **restore-all-data.js** - Complete restoration script that:
   - Restores all 10 images
   - Restores all 6 projects
   - Applies trademark compliance
   - Syncs to API
   - Auto-refreshes page

### 3. Current Replit Debugging Issue

The app was crashing due to:
1. Syntax error in `storm-data-service-clean.ts` (duplicate method code) - FIXED
2. Port 3000 conflict - attempted to use 3001, then reverted
3. Server binding issue - changed from `127.0.0.1` to `0.0.0.0`
4. Replit port configuration - updated `.replit` file from port 5000 to 3000

#### Current Status:
- Server is running successfully on port 3000
- Build completed successfully
- Replit webview is stuck loading
- Server is bound to 0.0.0.0:3000

#### Debugging Steps Taken:
1. Fixed TypeScript errors in storm-data-service-clean.ts
2. Changed server binding from 127.0.0.1 to 0.0.0.0
3. Updated .replit configuration to use port 3000
4. Built client successfully with `npm run build`
5. Verified server is running with proper logs

#### Next Steps:
- User needs to copy the Replit webview URL and open in new browser tab
- Once loaded, run restore-all-data.js script to restore localStorage data
- Possible URL formats:
  - `https://[long-id].id.repl.co`
  - `https://sigmaroofingwebsite-1.oksigmaroofs.repl.co`

### 4. Root Cause Analysis

The persistence issues are due to:
1. In-memory storage (`MemStorage` in `server/storage.ts`) that doesn't persist between environments
2. localStorage getting cleared between different domains/sessions
3. API returning 404 on production deployments

### 5. Benefits of Fallback Updates

Now the website has a three-tier fallback system:
1. **Primary**: API/Database (when implemented)
2. **Secondary**: localStorage
3. **Tertiary**: Hardcoded real images in source code

This ensures professional content displays even with complete system failure.