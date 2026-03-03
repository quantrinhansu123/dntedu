/**
 * Script to fix Firebase syntax errors - remove orphaned closing parentheses and undefined variables
 */

const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip lines that are just closing parentheses with no opening context
      if (trimmed === ');' || trimmed === '})' || trimmed === '});') {
        // Check if previous non-empty line is a comment or incomplete
        let prevNonEmpty = i - 1;
        while (prevNonEmpty >= 0 && lines[prevNonEmpty].trim() === '') {
          prevNonEmpty--;
        }
        
        if (prevNonEmpty >= 0) {
          const prevLine = lines[prevNonEmpty].trim();
          // If previous line is a comment or incomplete code, skip this closing paren
          if (prevLine.startsWith('//') || prevLine.startsWith('*') || prevLine.endsWith('{') || prevLine === '') {
            continue; // Skip this line
          }
        }
      }
      
      // Remove lines with undefined variables like snapshot, unsubscribe, allData, docSnap
      if (trimmed.includes('snapshot.') || 
          trimmed.includes('unsubscribe()') ||
          (trimmed.includes('allData') && !trimmed.includes('const allData') && !trimmed.includes('let allData')) ||
          (trimmed.includes('docSnap.') && !trimmed.includes('const docSnap') && !trimmed.includes('let docSnap')) ||
          (trimmed.includes('data') && trimmed.includes('setConfigs(data)') && !trimmed.includes('const data'))) {
        // Check if it's a variable declaration
        if (!trimmed.startsWith('const ') && !trimmed.startsWith('let ') && !trimmed.startsWith('var ')) {
          continue; // Skip this line
        }
      }
      
      newLines.push(line);
    }
    
    content = newLines.join('\n');
    
    // Clean up multiple empty lines
    content = content.replace(/\n{3,}/g, '\n\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
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

let totalFixed = 0;

if (fs.existsSync(pagesDir)) {
  const pagesFiles = walkDir(pagesDir);
  pagesFiles.forEach(file => {
    if (processFile(file)) totalFixed++;
  });
}

if (fs.existsSync(srcDir)) {
  const srcFiles = walkDir(srcDir);
  srcFiles.forEach(file => {
    if (processFile(file)) totalFixed++;
  });
}

console.log(`\n✓ Total files fixed: ${totalFixed}`);
console.log('Done!');
