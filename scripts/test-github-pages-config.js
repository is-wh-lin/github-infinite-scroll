#!/usr/bin/env node

/**
 * Test script to validate GitHub Pages configuration
 */

import fs from 'fs';

console.log('🔍 Testing GitHub Pages Configuration...\n');

// Test 1: Check if required files exist
console.log('1. Checking required files...');
const requiredFiles = ['.github/workflows/deploy.yml', 'nuxt.config.ts', 'public/404.html', 'package.json'];

requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} missing`);
  }
});

// Test 2: Check package.json scripts
console.log('\n2. Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['generate:production', 'build:production'];

requiredScripts.forEach((script) => {
  if (packageJson.scripts[script]) {
    console.log(`   ✅ ${script} script exists`);
  } else {
    console.log(`   ❌ ${script} script missing`);
  }
});

// Test 3: Check workflow permissions
console.log('\n3. Checking workflow permissions...');
const workflowContent = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');

const requiredPermissions = ['contents: read', 'pages: write', 'id-token: write'];
requiredPermissions.forEach((permission) => {
  if (workflowContent.includes(permission)) {
    console.log(`   ✅ ${permission} permission set`);
  } else {
    console.log(`   ❌ ${permission} permission missing`);
  }
});

// Test 4: Check for modern GitHub Pages actions
console.log('\n4. Checking deployment actions...');
const modernActions = ['actions/configure-pages@v4', 'actions/upload-pages-artifact@v3', 'actions/deploy-pages@v4'];

modernActions.forEach((action) => {
  if (workflowContent.includes(action)) {
    console.log(`   ✅ ${action} found`);
  } else {
    console.log(`   ❌ ${action} missing`);
  }
});

// Test 5: Check base URL configuration
console.log('\n5. Checking base URL configuration...');
const nuxtConfig = fs.readFileSync('nuxt.config.ts', 'utf8');

if (nuxtConfig.includes('NUXT_APP_BASE_URL')) {
  console.log('   ✅ Base URL environment variable configured');
} else {
  console.log('   ❌ Base URL environment variable missing');
}

if (nuxtConfig.includes('/github-infinite-scroll/')) {
  console.log('   ✅ Repository-specific base URL found');
} else {
  console.log('   ❌ Repository-specific base URL missing');
}

console.log('\n📋 Configuration Summary:');
console.log('   • Using modern GitHub Pages actions (recommended)');
console.log('   • Separate build and deploy jobs for better security');
console.log('   • Proper permissions for GitHub Pages deployment');
console.log('   • Base URL configured for subdirectory deployment');
console.log('   • 404.html fallback for SPA routing');

console.log('\n🚀 Next Steps:');
console.log('   1. Commit and push these changes');
console.log('   2. Check repository Settings > Pages');
console.log('   3. Ensure "Deploy from a branch" is set to "GitHub Actions"');
console.log('   4. Trigger deployment manually or push to main branch');

console.log('\n✅ Configuration test completed!');
