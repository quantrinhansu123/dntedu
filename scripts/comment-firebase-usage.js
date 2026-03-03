/**
 * Script to comment out all Firebase function calls in pages and src directories
 * This will prevent build errors while keeping the code for future migration
 */

const fs = require('fs');
const path = require('path');

const FIREBASE_FUNCTIONS = [
  'db',
  'updateDoc',
  'doc(',
  'collection(',
  'getDocs',
  'query(',
  'where(',
  'addDoc',
  'deleteDoc',
  'setDoc',
  'getDoc',
  'onSnapshot',
  'arrayUnion'
];

function shouldCommentLine(line) {
  // Skip if already commented
  if (line.trim().startsWith('//')) return false;
  
  // Check if line contains Firebase function calls
  return FIREBASE_FUNCTIONS.some(func => {
    const regex = new RegExp(`\\b${func.replace(/[()]/g, '\\$&')}\\b`);
    return regex.test(line);
  });
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line uses Firebase functions
    if (shouldCommentLine(line)) {
      // Check if it's part of a multi-line statement
      const trimmed = line.trim();
      if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith(')') && !trimmed.endsWith('}')) {
        // Might be a multi-line, check next few lines
        let fullStatement = line;
        let j = i + 1;
        let foundEnd = false;
        
        while (j < lines.length && j < i + 10 && !foundEnd) {
          fullStatement += '\n' + lines[j];
          if (lines[j].trim().endsWith(';') || lines[j].trim().endsWith(')') || lines[j].trim().endsWith('}')) {
            foundEnd = true;
          }
          j++;
        }
        
        if (foundEnd) {
          // Comment the whole block
          const commented = fullStatement.split('\n').map(l => 
            l.trim() ? '      // ' + l : l
          ).join('\n');
          newLines.push(commented);
          i = j - 1;
          modified = true;
          continue;
        }
      }
      
      // Single line comment
      const indent = line.match(/^(\s*)/)[1];
      newLines.push(indent + '// ' + line.trim());
      modified = true;
    } else {
      newLines.push(line);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log(`✓ Processed: ${filePath}`);
    return true;
  }
  
  return false;
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(file)) {
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

console.log('Starting Firebase usage commenting...\n');

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

console.log(`\n✓ Total files processed: ${totalProcessed}`);
console.log('Done!');
