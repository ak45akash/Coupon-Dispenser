# Implementation Ready - Tab Reorganization

## Current Structure Issue
- Tab 2 (API Key): Ends at line 669, missing code examples, not closed
- Old JWT Code Examples: Lines 671-1049 are OUTSIDE tabs - should be in Tab 3
- Tab 3 (JWT): Doesn't exist - needs to be created

## Implementation Plan

### Step 1: Complete Tab 2 (API Key Method)
After line 669, add:
- API Key Code Examples Card
- Platform selector (Node.js, Python, WordPress)  
- Code examples using helper functions
- Widget Embed Code
- Close `</TabsContent>`

### Step 2: Create Tab 3 (JWT Method)
Add new `TabsContent value="jwt"` with:
- Partner Secret Management Card
- Move JWT Code Examples from lines 671-1049
- Widget Embed Code
- Close `</TabsContent>`

### Step 3: Clean Up
- Remove old code section (lines 671-1049)
- Close tabs: `</Tabs></CardContent></Card>`

**This will reorganize ~380 lines of code. Ready to implement now!**

