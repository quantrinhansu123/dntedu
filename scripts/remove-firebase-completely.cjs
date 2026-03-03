/**
 * Script to completely remove all Firebase code from the project
 * - Removes Firebase imports
 * - Removes Firebase function calls
 * - Removes Firebase-related comments
 * - Deletes firebase config file
 */

const fs = require('fs');
const path = require('path');

const FIREBASE_IMPORTS = [
  /import\s+.*from\s+['"]firebase\/[^'"]+['"]/g,
  /import\s+.*from\s+['"]@firebase\/[^'"]+['"]/g,
  /import\s+.*from\s+['"]\.\.\/config\/firebase['"]/g,
  /import\s+.*from\s+['"]\.\.\/\.\.\/config\/firebase['"]/g,
  /import\s+.*from\s+['"]\.\.\/\.\.\/\.\.\/config\/firebase['"]/g,
  /import\s+.*from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/config\/firebase['"]/g,
  /const\s+.*=.*await\s+import\(['"]firebase\/[^'"]+['"]\)/g,
  /const\s+.*=.*await\s+import\(['"]\.\.\/config\/firebase['"]\)/g,
];

const FIREBASE_FUNCTIONS = [
  /\bdb\b/,
  /\bupdateDoc\b/,
  /\bdoc\(/,
  /\bcollection\(/,
  /\bgetDocs\b/,
  /\bquery\(/,
  /\bwhere\(/,
  /\baddDoc\b/,
  /\bdeleteDoc\b/,
  /\bsetDoc\b/,
  /\bgetDoc\b/,
  /\bonSnapshot\b/,
  /\barrayUnion\b/,
  /\bwriteBatch\b/,
  /\bTimestamp\b/,
  /\bauth\b.*firebase/,
];

function removeFirebaseImports(content) {
  let result = content;
  
  // Remove import statements
  FIREBASE_IMPORTS.forEach(pattern => {
    result = result.replace(pattern, '');
  });
  
  // Remove commented imports
  result = result.replace(/\/\/\s*import\s+.*from\s+['"]firebase[^\n]*\n/g, '');
  result = result.replace(/\/\/\s*import\s+.*from\s+['"]@firebase[^\n]*\n/g, '');
  result = result.replace(/\/\/\s*import\s+.*from\s+['"].*firebase[^\n]*\n/g, '');
  
  return result;
}

function removeFirebaseCodeBlocks(content) {
  const lines = content.split('\n');
  const newLines = [];
  let inFirebaseBlock = false;
  let blockIndent = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip lines that are only Firebase comments
    if (trimmed.startsWith('//') && (
      trimmed.includes('Firebase') || 
      trimmed.includes('firebase') ||
      trimmed.includes('đã được xóa')
    )) {
      continue;
    }
    
    // Check if line starts a Firebase code block
    const hasFirebaseFunction = FIREBASE_FUNCTIONS.some(pattern => pattern.test(line));
    const isCommentedFirebase = trimmed.startsWith('//') && hasFirebaseFunction;
    
    if (hasFirebaseFunction && !isCommentedFirebase) {
      // Start of Firebase block - skip it
      inFirebaseBlock = true;
      blockIndent = line.match(/^(\s*)/)[1];
      continue;
    }
    
    if (inFirebaseBlock) {
      // Check if we're still in the block
      const currentIndent = line.match(/^(\s*)/)[1];
      
      // If line is empty or has less indent, might be end of block
      if (!trimmed || currentIndent.length <= blockIndent.length) {
        // Check if it's a closing brace or semicolon from previous line
        if (i > 0 && lines[i-1].trim().endsWith(';') || lines[i-1].trim().endsWith('}')) {
          inFirebaseBlock = false;
          blockIndent = '';
          // Skip this line if it's just closing the Firebase block
          if (!trimmed || trimmed === '}') {
            continue;
          }
        } else {
          inFirebaseBlock = false;
          blockIndent = '';
        }
      } else {
        // Still in block, skip
        continue;
      }
    }
    
    // Remove commented Firebase code
    if (trimmed.startsWith('//') && hasFirebaseFunction) {
      continue;
    }
    
    // Remove lines that only contain Firebase variable declarations
    if (trimmed.match(/^(const|let|var)\s+(db|auth|storage)\s*=/)) {
      continue;
    }
    
    newLines.push(line);
  }
  
  return newLines.join('\n');
}

function cleanEmptyLines(content) {
  // Remove multiple consecutive empty lines
  return content.replace(/\n{3,}/g, '\n\n');
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove Firebase imports
    content = removeFirebaseImports(content);
    
    // Remove Firebase code blocks
    content = removeFirebaseCodeBlocks(content);
    
    // Clean up empty lines
    content = cleanEmptyLines(content);
    
    // Only write if changed
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
      if (!['node_modules', '.git', 'dist', 'build', '.next', 'functions'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main execution
console.log('Starting complete Firebase removal...\n');

// Delete firebase config file
const firebaseConfigPath = path.join(__dirname, '..', 'src', 'config', 'firebase.ts');
if (fs.existsSync(firebaseConfigPath)) {
  fs.unlinkSync(firebaseConfigPath);
  console.log(`✓ Deleted: ${firebaseConfigPath}`);
}

// Process all files
const pagesDir = path.join(__dirname, '..', 'pages');
const srcDir = path.join(__dirname, '..', 'src');

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
    // Skip firebase.ts itself
    if (!file.includes('firebase.ts')) {
      if (processFile(file)) totalProcessed++;
    }
  });
}

console.log(`\n✓ Total files processed: ${totalProcessed}`);
console.log('✓ Firebase config file deleted');
console.log('\nDone! All Firebase code has been removed.');
