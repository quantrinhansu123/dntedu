/**
 * Script to clean up all Firebase-related error messages and comments
 */

const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove Firebase error messages
    content = content.replace(/throw new Error\(['"]Firebase đã được xóa[^'"]*['"]\);/g, 
      'throw new Error(\'Tính năng này cần được migrate sang Supabase.\');');
    
    content = content.replace(/console\.warn\([^)]*Firebase[^)]*\);/g, '');
    content = content.replace(/console\.log\([^)]*Firebase[^)]*\);/g, '');
    content = content.replace(/alert\(['"]Firebase[^'"]*['"]\);/g, '');
    
    // Remove Firebase comments in headers
    content = content.replace(/\* Firebase đã được xóa[^\n]*\n/g, '');
    content = content.replace(/\/\/ Firebase đã được xóa[^\n]*\n/g, '');
    content = content.replace(/\/\/ Firebase[^\n]*đã được xóa[^\n]*\n/g, '');
    
    // Remove Firebase in error state messages
    content = content.replace(/useState<string \| null>\('Firebase đã được xóa[^']*'\)/g, 
      'useState<string | null>(\'Tính năng này cần được migrate sang Supabase.\')');
    
    // Clean up empty lines
    content = content.replace(/\n{3,}/g, '\n\n');
    
    if (content !== originalContent) {
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
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build', '.next', 'functions', 'scripts'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main execution
const pagesDir = path.join(__dirname, '..', 'pages');
const srcDir = path.join(__dirname, '..', 'src');
const componentsDir = path.join(__dirname, '..', 'components');

let totalProcessed = 0;

if (fs.existsSync(pagesDir)) {
  const pagesFiles = walkDir(pagesDir);
  pagesFiles.forEach(file => {
    if (processFile(file)) totalProcessed++;
  });
}

if (fs.existsSync(srcDir)) {
  const srcFiles = walkDir(srcDir);
  srcFiles.forEach(file => {
    if (processFile(file)) totalProcessed++;
  });
}

if (fs.existsSync(componentsDir)) {
  const componentFiles = walkDir(componentsDir);
  componentFiles.forEach(file => {
    if (processFile(file)) totalProcessed++;
  });
}

console.log(`\n✓ Total files processed: ${totalProcessed}`);
console.log('Done!');
