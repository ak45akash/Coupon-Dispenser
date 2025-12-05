# Cache and Style Fix Instructions

If you're experiencing missing styles or login issues, try these steps:

## 1. Clear Browser Cache
- **Chrome/Edge**: Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Select "Cached images and files"
- Click "Clear data"
- Or do a hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

## 2. Clear Next.js Build Cache
```bash
rm -rf .next
npm run dev
```

## 3. Clear Node Modules (if issues persist)
```bash
rm -rf node_modules .next
npm install
npm run dev
```

## 4. Check Environment Variables
Make sure these are set in your `.env.local`:
- `NEXTAUTH_SECRET` - Required for authentication
- `NEXT_PUBLIC_SUPABASE_URL` - Required for database
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Required for authentication
- `SUPABASE_SERVICE_ROLE_KEY` - Required for admin operations

## 5. Verify Login Credentials
Make sure you're using valid credentials. Check your Supabase database for user accounts.

## 6. Check Browser Console
Open browser DevTools (F12) and check:
- Console tab for JavaScript errors
- Network tab for failed requests (especially CSS files)
- Application tab > Cookies to verify session cookies are being set

## Common Issues:
1. **Styles not loading**: Usually a cache issue - try hard refresh
2. **Login not working**: Check NEXTAUTH_SECRET is set and user exists in database
3. **404 on CSS files**: Clear .next folder and rebuild

