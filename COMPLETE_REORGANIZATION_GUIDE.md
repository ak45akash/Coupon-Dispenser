# Complete Tab Reorganization Guide

## File Structure Overview
The vendor dashboard page (`app/dashboard/vendors/[id]/page.tsx`) is 1480 lines and needs reorganization.

## Current Problem
- Tab 1 (WordPress): ✅ Complete
- Tab 2 (API Key): Has management card, missing code examples, not closed properly
- Tab 3 (JWT): Doesn't exist - old code (lines 671-1049) is outside tabs

## Solution

### Step 1: Complete Tab 2 (API Key Method)
After line 669 (end of API Key Management card), add:
- API Key Code Examples card with platform selector
- Node.js, Python, WordPress code examples
- Widget Embed Code section
- Close `</TabsContent>` tag

### Step 2: Create Tab 3 (JWT Method)
Add new `TabsContent value="jwt"` with:
- Partner Secret Management card (from old location)
- JWT Code Examples (move from lines 671-1049)
- Widget Embed Code section
- Close `</TabsContent>` tag

### Step 3: Clean Up
- Remove old code examples section (lines 671-1049)
- Close tabs structure with `</Tabs>` and `</CardContent>`

## Helper Functions Available
- `getApiKeyNodeCode()` - Line 319
- `getApiKeyPythonCode()` - Line 284  
- `getPythonCode()` - Line 245 (for JWT)

**I'll now implement this reorganization step by step.**

