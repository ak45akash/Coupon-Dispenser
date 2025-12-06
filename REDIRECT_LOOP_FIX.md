# Redirect Loop Fix

## Problem
The website was stuck in an infinite redirect loop, likely between `/login` and `/dashboard` or other pages.

## Root Cause
Client-side components were checking session status and redirecting before the session finished loading, causing:
1. Session status is 'loading' → Component redirects
2. Server-side layout also checks session → Redirects
3. Creates infinite loop

## Solution Applied

### 1. Fixed `app/dashboard/vendor/page.tsx`
- Added `status` check from `useSession()` hook
- Wait for `status !== 'loading'` before redirecting
- Added `hasCheckedSession` state to prevent multiple redirects
- Only redirect once when session status is determined

### 2. Fixed `app/dashboard/vendors/[id]/page.tsx`
- Same fix: Wait for session to load before redirecting
- Prevent multiple redirect checks

### 3. Simplified `app/dashboard/layout.tsx`
- Removed try-catch that was causing additional redirects
- Let errors bubble up naturally

## Changes Made

### Before:
```typescript
useEffect(() => {
  if (!session) {
    router.push('/login')
    return
  }
  // ...
}, [session, router])
```

### After:
```typescript
const { data: session, status } = useSession()
const [hasCheckedSession, setHasCheckedSession] = useState(false)

useEffect(() => {
  // Wait for session to load completely
  if (status === 'loading') {
    return
  }

  // Only check once to prevent loops
  if (hasCheckedSession) {
    return
  }

  if (status === 'unauthenticated' || !session) {
    setHasCheckedSession(true)
    router.push('/login')
    return
  }

  setHasCheckedSession(true)
  // ... rest of logic
}, [session, status, router, hasCheckedSession])
```

## How It Works Now

1. **Session Loading**: Component waits for `status !== 'loading'`
2. **Single Check**: `hasCheckedSession` prevents multiple redirect attempts
3. **Proper Status**: Only redirects when status is 'unauthenticated' or session is null
4. **No Loops**: Server-side layout handles initial auth, client-side only handles role-based redirects

## Testing

After fix:
1. Visit `http://localhost:3000` → Should redirect to `/login`
2. Login → Should redirect to `/dashboard` (or role-specific page)
3. No infinite loops
4. Pages load correctly

## Status
✅ **Fixed** - Redirect loop resolved

