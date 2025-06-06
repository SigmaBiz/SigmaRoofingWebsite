# Instructions to Update Replit to Latest Version

## In your Replit, run these commands in the Shell:

```bash
# 1. Check current status
git status

# 2. If there are uncommitted changes, stash them
git stash

# 3. Pull the latest changes
git pull origin staging-mobile-fix

# 4. Apply stashed changes if needed
git stash pop

# 5. Rebuild the project
npm run build

# 6. Restart the server
npm run dev
```

## Alternative if the above doesn't work:

```bash
# Force update to latest
git fetch origin
git reset --hard origin/staging-mobile-fix
npm run build
npm run dev
```

## To verify after update:

1. The Debug button should disappear
2. Add `?debug=true` to URL to see it
3. The project text should say "Custom project gallery showcasing our latest work." (without "admin panel")

## Expected commit:
```
ca8f27d feat: Replace all Unsplash fallback images with real Cloudinary images and add debug panel controls
```