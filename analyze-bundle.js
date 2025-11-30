/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '.next');
const chunksDir = path.join(buildDir, 'static', 'chunks');

console.log('\n📦 Bundle Analysis\n');

function getSize(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2);
}

function analyzeChunks() {
  if (!fs.existsSync(chunksDir)) {
    console.log('❌ No chunks directory found. Run build first.');
    return;
  }

  const files = fs
    .readdirSync(chunksDir)
    .filter(f => f.endsWith('.js'))
    .map(f => ({
      name: f,
      size: getSize(path.join(chunksDir, f)),
      path: path.join(chunksDir, f),
    }))
    .sort((a, b) => parseFloat(b.size) - parseFloat(a.size));

  console.log('Top 10 Largest Chunks:\n');
  files.slice(0, 10).forEach((file, i) => {
    console.log(`${i + 1}. ${file.name}`);
    console.log(`   Size: ${file.size} kB\n`);
  });

  const totalSize = files.reduce((sum, f) => sum + parseFloat(f.size), 0);
  console.log(`\nTotal chunks size: ${totalSize.toFixed(2)} kB`);
  console.log(`Number of chunks: ${files.length}`);
}

analyzeChunks();
