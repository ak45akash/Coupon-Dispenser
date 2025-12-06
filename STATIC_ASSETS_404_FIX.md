# Fix 404 Errors for Static Assets

## Problem
You're seeing 404 errors for Next.js static assets:
- `/next/static/css/app/layout.css`
- `/next/static/chunks/main-app.js`
- `/next/static/chunks/app-pages-internals.js`
- `/next/static/chunks/app/error.js`
- etc.

## Root Cause
The `.next` build folder is corrupted or missing required files. This can happen when:
1. Build was interrupted
2. macOS system files (._*) interfered
3. Cache corruption
4. Incomplete build

## Solution

### Step 1: Stop the Dev Server
Press `Ctrl+C` or `Cmd+C` in the terminal where `npm run dev` is running.

### Step 2: Clear Build Cache
```bash
rm -rf .next
```

### Step 3: Restart Dev Server
```bash
npm run dev
```

### Step 4: Hard Refresh Browser
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

## Alternative: Full Clean

If the issue persists, do a full clean:

```bash
# Stop dev server (Ctrl+C)
rm -rf .next node_modules/.cache
npm run dev
```

## If Still Not Working

### Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Check Dev Server Output
Make sure the dev server shows:
```
✓ Ready in [time]
○ Compiling / ...
✓ Compiled successfully
```

### Verify Port
Make sure nothing else is using port 3000:
```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null
npm run dev
```

## Prevention

The `.gitignore` should already exclude `.next` and macOS files. If issues persist, make sure:

1. `.next/` is in `.gitignore`
2. `._*` (macOS files) are ignored
3. `.DS_Store` is ignored

## Quick Fix Command

Run this single command to fix everything:

```bash
rm -rf .next && npm run dev
```

Then hard refresh your browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

---

**After fixing, the 404 errors should be gone and your app should load correctly!** ✅

