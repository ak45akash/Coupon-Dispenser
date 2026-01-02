#!/usr/bin/env node
/**
 * Validation script for widget-embed.js
 * Ensures the file is valid JavaScript before deployment
 */

const fs = require('fs');
const path = require('path');

const widgetPath = path.join(__dirname, '..', 'public', 'widget-embed.js');

console.log('Validating widget-embed.js...\n');

// Check if file exists
if (!fs.existsSync(widgetPath)) {
  console.error('❌ ERROR: widget-embed.js not found at:', widgetPath);
  process.exit(1);
}

// Read file
const content = fs.readFileSync(widgetPath, 'utf8');

// Check file size
const fileSize = content.length;
console.log(`✓ File size: ${fileSize} bytes`);

// Check line count
const lineCount = content.split('\n').length;
console.log(`✓ Line count: ${lineCount} lines`);

// Check for syntax errors by trying to parse it
try {
  // Use eval in a safe way to check syntax (won't execute, just parse)
  new Function(content);
  console.log('✓ JavaScript syntax is valid');
} catch (error) {
  console.error('❌ ERROR: JavaScript syntax error:', error.message);
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
  process.exit(1);
}

// Check for suspicious patterns
const suspiciousPatterns = [
  { pattern: /<<</g, name: 'Triple less-than (<<<)' },
  { pattern: /<<[^<]/g, name: 'Double less-than (<<)' },
  { pattern: /[^\s]<<[^\s]/g, name: 'Unexpected << operator' },
];

let foundIssues = false;
for (const { pattern, name } of suspiciousPatterns) {
  const matches = content.match(pattern);
  if (matches) {
    console.error(`❌ WARNING: Found ${matches.length} occurrence(s) of ${name}`);
    foundIssues = true;
  }
}

// Check file ends correctly
if (!content.trim().endsWith('})(window, document)')) {
  console.error('❌ WARNING: File does not end with expected closing pattern');
  foundIssues = true;
}

// Check for version marker
if (!content.includes('Version:')) {
  console.warn('⚠ WARNING: Version marker not found in file header');
}

if (foundIssues) {
  console.error('\n❌ Validation failed - please fix issues before deploying');
  process.exit(1);
}

console.log('\n✅ All validations passed! File is ready for deployment.');

