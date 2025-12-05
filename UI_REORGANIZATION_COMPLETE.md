# UI Reorganization - Complete Plan

## Summary
The vendor dashboard needs to be reorganized into three tabs:
1. **WordPress Plugin** - Zero code (placeholder exists ✅)
2. **API Key Method** - Simple method (has management card, needs code examples)
3. **JWT Method** - Advanced method (needs Partner Secret + Code Examples)

## Current State
- Tab 1 (WordPress): ✅ Complete placeholder
- Tab 2 (API Key): Has API Key Management card, missing code examples
- Tab 3 (JWT): Missing - old code examples section (lines 671-1049) is outside tabs

## What Needs to Be Done

### 1. Complete Tab 2 (API Key Method)
- ✅ API Key Management card exists
- ❌ Add API Key code examples (Node.js, Python, WordPress)
- ❌ Add Widget Embed Code section
- ❌ Close TabsContent properly

### 2. Create Tab 3 (JWT Method)
- Add Partner Secret Management card
- Move existing JWT code examples from old section (lines 671-1049)
- Add Widget Embed Code section
- Close TabsContent

### 3. Remove Old Section
- Delete misplaced code examples section (lines 671-1049)

## Helper Functions Available
- `getApiKeyPythonCode()` - line 284
- `getApiKeyNodeCode()` - line 319
- `getPythonCode()` - line 245 (for JWT)

**Ready to implement!** I'll now reorganize the file structure properly.

