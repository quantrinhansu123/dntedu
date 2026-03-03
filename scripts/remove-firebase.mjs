/**
 * Script to remove/comment out Firebase imports and logic
 * Run: node scripts/remove-firebase.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Comment out Firebase imports
    const firebaseImportPattern = /^import\s+.*from\s+['"]firebase\//gm;
    if (firebaseImportPattern.test(content)) {
      content = content.replace(firebaseImportPattern, (match) => {
        modified = true;
        return `// ${match} // Firebase đã được xóa`;
      });
    }

    // Comment out @firebase imports
    const atFirebaseImportPattern = /^import\s+.*from\s+['"]@firebase\//gm;
    if (atFirebaseImportPattern.test(content)) {
      content = content.replace(atFirebaseImportPattern, (match) => {
        modified = true;
        return `// ${match} // Firebase đã được xóa`;
      });
    }

    // Comment out Firebase config imports
    const firebaseConfigPattern = /^import\s+.*from\s+['"]\.\.\/config\/firebase['"]/gm;
    if (firebaseConfigPattern.test(content)) {
      content = content.replace(firebaseConfigPattern, (match) => {
        modified = true;
        return `// ${match} // Firebase đã được xóa`;
      });
    }

    const firebaseConfigPattern2 = /^import\s+.*from\s+['"]\.\.\/\.\.\/config\/firebase['"]/gm;
    if (firebaseConfigPattern2.test(content)) {
      content = content.replace(firebaseConfigPattern2, (match) => {
        modified = true;
        return `// ${match} // Firebase đã được xóa`;
      });
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Processed: ${path.relative(rootDir, filePath)}`);
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
      if (!['node_modules', '.git', 'dist', 'build', 'functions/lib', '.next', 'lib'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Only process TypeScript files
      if (!filePath.includes('node_modules') && 
          !filePath.includes('functions/lib') &&
          !filePath.includes('.test.') &&
          !filePath.includes('.spec.') &&
          !filePath.includes('syncStaffToSupabase') &&
          !filePath.includes('syncClassesToSupabase')) {
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
