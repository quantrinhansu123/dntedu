/**
 * Script to remove/comment out Firebase imports and logic
 * Run: node scripts/remove-firebase-imports.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Patterns to find and replace
const patterns = [
  // Comment out Firebase imports
  {
    find: /import\s+.*from\s+['"]firebase\//g,
    replace: (match) => `// ${match} // Firebase đã được xóa`
  },
  {
    find: /import\s+.*from\s+['"]@firebase\//g,
    replace: (match) => `// ${match} // Firebase đã được xóa`
  },
  // Comment out Firebase config imports
  {
    find: /import\s+.*from\s+['"]\.\.\/config\/firebase['"]/g,
    replace: (match) => `// ${match} // Firebase đã được xóa`
  },
  {
    find: /import\s+.*from\s+['"]\.\.\/\.\.\/config\/firebase['"]/g,
    replace: (match) => `// ${match} // Firebase đã được xóa`
  },
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    patterns.forEach(({ find, replace }) => {
      const newContent = content.replace(find, (match) => {
        modified = true;
        return typeof replace === 'function' ? replace(match) : replace;
      });
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Processed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .git, dist, build, functions/lib
      if (!['node_modules', '.git', 'dist', 'build', 'functions/lib', '.next'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Only process TypeScript files
      if (!filePath.includes('node_modules') && 
          !filePath.includes('functions/lib') &&
          !filePath.includes('.test.') &&
          !filePath.includes('.spec.')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Main execution
console.log('Starting Firebase removal process...\n');

const srcDir = path.join(rootDir, 'src');
const files = walkDir(srcDir);

console.log(`Found ${files.length} TypeScript files to process\n`);

let processedCount = 0;
files.forEach(file => {
  if (processFile(file)) {
    processedCount++;
  }
});

console.log(`\n✓ Processed ${processedCount} files`);
console.log('Done!');
