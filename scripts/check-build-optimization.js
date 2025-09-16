#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Check build optimization results
 */
function checkBuildOptimization() {
  console.log('🔍 Checking build optimization results...\n');

  const outputDir = '.output/public';

  if (!fs.existsSync(outputDir)) {
    console.error('❌ Build output directory not found. Run npm run generate first.');
    process.exit(1);
  }

  // Check file sizes
  const files = getAllFiles(outputDir);
  const stats = analyzeFiles(files);

  console.log('📊 Build Analysis Results:');
  console.log('========================\n');

  console.log(`📄 Total Files: ${stats.totalFiles}`);
  console.log(`📦 Total Size: ${formatBytes(stats.totalSize)}\n`);

  console.log('📋 File Type Breakdown:');
  Object.entries(stats.byType).forEach(([type, data]) => {
    console.log(`  ${type.toUpperCase()}: ${data.count} files, ${formatBytes(data.size)}`);
  });

  console.log('\n🎯 Optimization Checks:');

  // Check for minification
  const jsFiles = files.filter((f) => f.endsWith('.js'));
  const minifiedJs = jsFiles.filter((f) => {
    const content = fs.readFileSync(f, 'utf8');
    return content.length > 0 && !content.includes('\n  '); // Simple minification check
  });

  console.log(`  ✅ JavaScript Minification: ${minifiedJs.length}/${jsFiles.length} files minified`);

  // Check for CSS optimization
  const cssFiles = files.filter((f) => f.endsWith('.css'));
  const minifiedCss = cssFiles.filter((f) => {
    const content = fs.readFileSync(f, 'utf8');
    return content.length > 0 && !content.includes('\n  '); // Simple minification check
  });

  console.log(`  ✅ CSS Minification: ${minifiedCss.length}/${cssFiles.length} files minified`);

  // Check for hash-based naming
  const hashedFiles = files.filter((f) => /-[a-f0-9]{8,}\./.test(path.basename(f)));
  console.log(`  ✅ Cache-busting Hashes: ${hashedFiles.length}/${files.length} files have hashes`);

  // Check for compression opportunities
  const largeFiles = files.filter((f) => {
    const stats = fs.statSync(f);
    return stats.size > 100 * 1024; // Files larger than 100KB
  });

  if (largeFiles.length > 0) {
    console.log(`\n⚠️  Large Files (>100KB):`);
    largeFiles.forEach((f) => {
      const stats = fs.statSync(f);
      const relativePath = path.relative(outputDir, f);
      console.log(`    ${relativePath}: ${formatBytes(stats.size)}`);
    });
  }

  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');

  if (stats.totalSize > 2 * 1024 * 1024) {
    // 2MB
    console.log('  ⚠️  Total bundle size is large. Consider code splitting or lazy loading.');
  } else {
    console.log('  ✅ Total bundle size is within recommended limits.');
  }

  if (largeFiles.length > 3) {
    console.log('  ⚠️  Multiple large files detected. Consider optimization or chunking.');
  } else {
    console.log('  ✅ File sizes are well distributed.');
  }

  const chunkFiles = files.filter((f) => f.includes('chunk') || f.includes('vendor'));
  if (chunkFiles.length > 0) {
    console.log(`  ✅ Code splitting detected: ${chunkFiles.length} chunk files`);
  }

  console.log('\n✅ Build optimization check complete!');
}

function getAllFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        traverse(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function analyzeFiles(files) {
  const stats = {
    totalFiles: files.length,
    totalSize: 0,
    byType: {},
  };

  files.forEach((file) => {
    const fileStats = fs.statSync(file);
    const ext = path.extname(file).slice(1) || 'no-ext';

    stats.totalSize += fileStats.size;

    if (!stats.byType[ext]) {
      stats.byType[ext] = { count: 0, size: 0 };
    }

    stats.byType[ext].count++;
    stats.byType[ext].size += fileStats.size;
  });

  return stats;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the check
if (import.meta.url === `file://${process.argv[1]}`) {
  checkBuildOptimization();
}

export { checkBuildOptimization };
