# Tab Reorganization Plan

## Current Issues:
1. Tab 2 (API Key) has API Key Management card but no code examples
2. Old code examples section (lines 671-1049) is OUTSIDE the tabs structure - should be in Tab 3
3. Tab 3 (JWT Method) doesn't exist yet - needs Partner Secret Management + Code Examples

## What Needs to Happen:

### Tab 2 (API Key Method) - Lines 586-669
- ✅ Has API Key Management card
- ❌ Missing: API Key code examples for Node.js, Python, WordPress
- ❌ Missing: Close TabsContent properly

### Tab 3 (JWT Method) - NEEDS TO BE CREATED
- Partner Secret Management card (move from old location)
- JWT Code Examples (move from old location lines 671-1049)
- Widget Embed Code

### Remove:
- Old misplaced code examples section (lines 671-1049)

## Implementation Steps:
1. Close Tab 2 after API Key Management card (line 669)
2. Add API Key code examples to Tab 2 (using getApiKeyNodeCode, getApiKeyPythonCode)
3. Create Tab 3 with Partner Secret Management + JWT Code Examples
4. Remove old misplaced section (lines 671-1049)
