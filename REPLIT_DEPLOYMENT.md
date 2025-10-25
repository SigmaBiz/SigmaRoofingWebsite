# Replit Deployment Instructions for SigmaRoofingWebsite

## Current Version Information
- **Repository**: https://github.com/SigmaBiz/SigmaRoofingWebsite.git
- **Branch**: staging-mobile-fix
- **Commit**: faf1d5201b684fcb7368376f685cef4362826d41

## Step 1: Import to Replit

1. Go to [Replit](https://replit.com)
2. Click "Create Repl" or "+" button
3. Select "Import from GitHub"
4. In the GitHub URL field, paste:
   ```
   https://github.com/SigmaBiz/SigmaRoofingWebsite.git
   ```
5. **IMPORTANT**: After importing, you need to switch to the correct branch

## Step 2: Switch to the Correct Branch

Once the Repl is created, open the Shell/Terminal and run:

```bash
# Fetch all branches from remote
git fetch --all

# Switch to the staging-mobile-fix branch
git checkout staging-mobile-fix

# Verify you're on the correct branch
git branch
```

## Step 3: Install Dependencies

In the Shell, run:

```bash
# Install all dependencies
npm install

# If you encounter any issues, try:
npm install --force
```

## Step 4: Configure Environment Variables

1. Click on the "Secrets" tab (lock icon) in Replit
2. Add any necessary environment variables if needed

## Step 5: Start the Development Server

In the Shell, run:

```bash
# Start the development server
npm run dev
```

The server should start on port 3000. Replit will automatically detect this and show the preview.

## Alternative: Direct Clone Command

If you prefer to clone directly in Replit Shell:

```bash
# Clone the specific branch directly
git clone -b staging-mobile-fix https://github.com/SigmaBiz/SigmaRoofingWebsite.git .

# Install dependencies
npm install

# Start the server
npm run dev
```

## Troubleshooting

### If the site doesn't load:
1. Check the Console for any errors
2. Make sure all dependencies installed correctly
3. Verify you're on the `staging-mobile-fix` branch
4. Try running `npm run build` first, then `npm run dev`

### If you see TypeScript errors:
- These can often be ignored in development mode
- The site should still run despite TS warnings

### Port issues:
- The app runs on port 3000 by default
- Replit should automatically detect and proxy this
- If not, check the `.replit` file configuration

## Verification

To verify you have the correct version:
1. Check that the hero component has the original layout (buttons side by side)
2. The header should have a gray background (bg-gray-50)
3. All debug scripts should be present in the root directory

## Important Files to Check
- `/client/src/components/hero.tsx` - Should have the reverted layout
- `/client/src/components/header.tsx` - Should have bg-gray-50
- `/server/index.ts` - Main server file
- `/package.json` - Contains all scripts and dependencies