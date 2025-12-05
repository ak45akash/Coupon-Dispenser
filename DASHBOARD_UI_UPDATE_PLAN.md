# Vendor Dashboard UI Update Plan

## Current Structure
- Vendor Info Card
- Partner Secret Management Card
- Integration Code Examples (WordPress, Node.js, Python for JWT method)
- Widget Embed Code
- Coupon Stats
- Coupons Management

## New Structure with Tabs

### Integration Section (New Tabbed Layout)

**Tab 1: WordPress Plugin** (Zero Code)
- Coming soon / Download plugin button
- Installation instructions
- Widget embed code

**Tab 2: API Key Method** (Simple)
- API Key Management Card (similar to Partner Secret)
- Code Examples (Node.js, Python, WordPress)
- Widget embed code with API key

**Tab 3: JWT Method** (Advanced)
- Partner Secret Management Card (existing)
- Integration Code Examples (existing)
- Widget embed code

## Implementation Steps

1. ✅ Add Tabs component import
2. ✅ Add API key state management
3. ✅ Add API key fetch/generate functions
4. ✅ Create API Key Management Card
5. ✅ Reorganize Partner Secret + Code Examples into Tab 3
6. ✅ Create Tab 2 with API Key method
7. ✅ Create Tab 1 placeholder for WordPress Plugin

## Code Changes Required

1. Add imports: `Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs`
2. Add state: `apiKey`, `showApiKey`, `copiedApiKey`, `generatingApiKey`
3. Add functions: `fetchApiKeyStatus()`, `generateApiKey()`, `copyApiKey()`
4. Reorganize UI: Wrap Partner Secret + Code Examples in Tab 3
5. Add Tab 2: API Key method with code examples
6. Add Tab 1: WordPress Plugin placeholder

