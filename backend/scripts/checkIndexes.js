const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Function to check for duplicate indexes in a model file
function checkModelIndexes(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Check for unique: true declarations
    const uniqueFields = [];
    const uniqueMatches = content.match(/unique:\s*true/g);
    if (uniqueMatches) {
      uniqueMatches.forEach(match => {
        const lineNumber = content.split('\n').findIndex(line => line.includes(match)) + 1;
        uniqueFields.push({ line: lineNumber, match });
      });
    }
    
    // Check for schema.index() declarations
    const schemaIndexes = [];
    const indexMatches = content.match(/\.index\(/g);
    if (indexMatches) {
      indexMatches.forEach(match => {
        const lineNumber = content.split('\n').findIndex(line => line.includes(match)) + 1;
        schemaIndexes.push({ line: lineNumber, match });
      });
    }
    
    // Check for index: true declarations
    const indexTrueFields = [];
    const indexTrueMatches = content.match(/index:\s*true/g);
    if (indexTrueMatches) {
      indexTrueMatches.forEach(match => {
        const lineNumber = content.split('\n').findIndex(line => line.includes(match)) + 1;
        indexTrueFields.push({ line: lineNumber, match });
      });
    }
    
    if (uniqueFields.length > 0 || schemaIndexes.length > 0 || indexTrueFields.length > 0) {
      console.log(`\n📁 ${fileName}:`);
      
      if (uniqueFields.length > 0) {
        console.log('  🔑 Unique fields:');
        uniqueFields.forEach(field => {
          console.log(`    Line ${field.line}: ${field.match}`);
        });
      }
      
      if (schemaIndexes.length > 0) {
        console.log('  📊 Schema indexes:');
        schemaIndexes.forEach(index => {
          console.log(`    Line ${index.line}: ${index.match}`);
        });
      }
      
      if (indexTrueFields.length > 0) {
        console.log('  📈 Index true fields:');
        indexTrueFields.forEach(field => {
          console.log(`    Line ${field.line}: ${field.match}`);
        });
      }
      
      // Check for potential conflicts
      if (uniqueFields.length > 0 && schemaIndexes.length > 0) {
        console.log('  ⚠️  Potential duplicate indexes detected!');
        console.log('     Fields with unique: true automatically create indexes');
        console.log('     Avoid adding .index() for the same fields');
      }
    }
    
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
}

// Main function
async function main() {
  console.log('🔍 Checking for duplicate indexes in models...\n');
  
  const modelsDir = path.join(__dirname, '..', 'models');
  const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));
  
  modelFiles.forEach(file => {
    const filePath = path.join(modelsDir, file);
    checkModelIndexes(filePath);
  });
  
  console.log('\n✅ Index check completed!');
  console.log('\n💡 Tips to avoid duplicate indexes:');
  console.log('   - Fields with unique: true automatically create indexes');
  console.log('   - Don\'t add .index() for fields that already have unique: true');
  console.log('   - Use compound indexes for multiple fields instead of individual ones');
}

// Run the check
main().catch(console.error);
