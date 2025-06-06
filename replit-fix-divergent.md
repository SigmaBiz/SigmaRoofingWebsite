# Fix Divergent Branches in Replit

Run these commands in order:

```bash
# 1. First, let's see what's different
git status

# 2. Configure to use merge (recommended)
git config pull.rebase false

# 3. Now pull with merge
git pull origin staging-mobile-fix

# 4. If there are conflicts, you'll need to resolve them
# Check for conflicts with:
git status

# 5. After resolving any conflicts (if any), rebuild:
npm run build

# 6. Restart the server:
npm run dev
```

## If the above creates too many conflicts, use this alternative:

```bash
# WARNING: This will discard any local changes in Replit
# Only use if you don't have important local changes

# 1. Backup any important files first!

# 2. Force reset to match GitHub exactly
git fetch origin
git reset --hard origin/staging-mobile-fix

# 3. Verify you're on the right commit
git log -1 --oneline
# Should show: ca8f27d feat: Replace all Unsplash fallback images...

# 4. Rebuild
npm run build

# 5. Start server
npm run dev
```