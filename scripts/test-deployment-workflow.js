#!/usr/bin/env node

/**
 * Deployment Workflow Test Script
 *
 * This script tests the GitHub Pages deployment workflow by:
 * 1. Validating the build process locally
 * 2. Testing static generation functionality
 * 3. Verifying deployment configuration
 * 4. Checking application functionality after build
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test configuration
const testConfig = {
  outputDir: '.output/public',
  requiredFiles: ['index.html', '404.html', 'assets'],
  requiredAssets: ['favicon.ico'],
  maxBuildTime: 300000, // 5 minutes
  minFileCount: 5,
  maxBundleSize: 10 * 1024 * 1024, // 10MB
};

class DeploymentTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
    };
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logTest(name, status, details = '') {
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';

    this.log(`${icon} ${name}`, color);
    if (details) {
      this.log(`   ${details}`, 'cyan');
    }

    this.results.tests.push({ name, status, details });
    if (status === 'pass') this.results.passed++;
    else if (status === 'fail') this.results.failed++;
    else this.results.warnings++;
  }

  async runCommand(command, options = {}) {
    try {
      const result = execSync(command, {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options,
      });
      return { success: true, output: result };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: error.stdout || error.stderr || '',
      };
    }
  }

  async testEnvironmentSetup() {
    this.log('\n🔧 Testing Environment Setup', 'bright');

    // Test Node.js version
    const nodeResult = await this.runCommand('node --version', { silent: true });
    if (nodeResult.success) {
      const version = nodeResult.output.trim();
      const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
      if (majorVersion >= 18) {
        this.logTest('Node.js version', 'pass', `${version} (>= 18 required)`);
      } else {
        this.logTest('Node.js version', 'fail', `${version} (>= 18 required)`);
      }
    } else {
      this.logTest('Node.js version', 'fail', 'Node.js not found');
    }

    // Test npm availability
    const npmResult = await this.runCommand('npm --version', { silent: true });
    if (npmResult.success) {
      this.logTest('npm availability', 'pass', `v${npmResult.output.trim()}`);
    } else {
      this.logTest('npm availability', 'fail', 'npm not found');
    }

    // Test dependencies installation
    if (existsSync(join(projectRoot, 'node_modules'))) {
      this.logTest('Dependencies installed', 'pass', 'node_modules directory exists');
    } else {
      this.logTest('Dependencies installed', 'fail', 'node_modules directory missing');
    }

    // Test package.json scripts
    const packageJsonPath = join(projectRoot, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      const requiredScripts = ['generate', 'generate:production', 'build'];
      const missingScripts = requiredScripts.filter((script) => !packageJson.scripts[script]);

      if (missingScripts.length === 0) {
        this.logTest('Required scripts', 'pass', 'All deployment scripts available');
      } else {
        this.logTest('Required scripts', 'fail', `Missing: ${missingScripts.join(', ')}`);
      }
    } else {
      this.logTest('Package.json', 'fail', 'package.json not found');
    }
  }

  async testBuildProcess() {
    this.log('\n🏗️ Testing Build Process', 'bright');

    // Clean previous build
    this.log('Cleaning previous build...', 'yellow');
    await this.runCommand('rm -rf .output .nuxt', { silent: true });

    // Test static generation
    this.log('Running static generation...', 'yellow');
    const buildStart = Date.now();
    const buildResult = await this.runCommand('npm run generate:production');
    const buildTime = Date.now() - buildStart;

    if (buildResult.success) {
      if (buildTime < testConfig.maxBuildTime) {
        this.logTest('Build process', 'pass', `Completed in ${Math.round(buildTime / 1000)}s`);
      } else {
        this.logTest('Build process', 'warn', `Slow build: ${Math.round(buildTime / 1000)}s`);
      }
    } else {
      this.logTest('Build process', 'fail', 'Build failed');
      return false;
    }

    return true;
  }

  async testBuildOutput() {
    this.log('\n📁 Testing Build Output', 'bright');

    const outputPath = join(projectRoot, testConfig.outputDir);

    // Test output directory exists
    if (existsSync(outputPath)) {
      this.logTest('Output directory', 'pass', `${testConfig.outputDir} exists`);
    } else {
      this.logTest('Output directory', 'fail', `${testConfig.outputDir} not found`);
      return false;
    }

    // Test required files
    for (const file of testConfig.requiredFiles) {
      const filePath = join(outputPath, file);
      if (existsSync(filePath)) {
        const stats = statSync(filePath);
        if (stats.isDirectory()) {
          this.logTest(`Required directory: ${file}`, 'pass', 'Directory exists');
        } else {
          const size = Math.round(stats.size / 1024);
          this.logTest(`Required file: ${file}`, 'pass', `${size}KB`);
        }
      } else {
        this.logTest(`Required file: ${file}`, 'fail', 'File not found');
      }
    }

    // Test file count
    const result = await this.runCommand(`find ${testConfig.outputDir} -type f | wc -l`, { silent: true });
    if (result.success) {
      const fileCount = parseInt(result.output.trim());
      if (fileCount >= testConfig.minFileCount) {
        this.logTest('File count', 'pass', `${fileCount} files generated`);
      } else {
        this.logTest('File count', 'fail', `Only ${fileCount} files (minimum ${testConfig.minFileCount})`);
      }
    }

    // Test bundle size
    const sizeResult = await this.runCommand(`du -sb ${testConfig.outputDir}`, { silent: true });
    if (sizeResult.success) {
      const totalSize = parseInt(sizeResult.output.split('\t')[0]);
      const sizeMB = Math.round((totalSize / (1024 * 1024)) * 100) / 100;

      if (totalSize <= testConfig.maxBundleSize) {
        this.logTest('Bundle size', 'pass', `${sizeMB}MB`);
      } else {
        this.logTest('Bundle size', 'warn', `${sizeMB}MB (large bundle)`);
      }
    }

    return true;
  }

  async testApplicationFunctionality() {
    this.log('\n🧪 Testing Application Functionality', 'bright');

    const outputPath = join(projectRoot, testConfig.outputDir);

    // Test index.html content
    const indexPath = join(outputPath, 'index.html');
    if (existsSync(indexPath)) {
      const indexContent = readFileSync(indexPath, 'utf8');

      // Check for essential HTML structure
      if (indexContent.includes('<html') && indexContent.includes('</html>')) {
        this.logTest('HTML structure', 'pass', 'Valid HTML document');
      } else {
        this.logTest('HTML structure', 'fail', 'Invalid HTML structure');
      }

      // Check for Vue/Nuxt app mounting
      if (indexContent.includes('__nuxt') || indexContent.includes('nuxt')) {
        this.logTest('Nuxt integration', 'pass', 'Nuxt app structure found');
      } else {
        this.logTest('Nuxt integration', 'warn', 'Nuxt app structure not detected');
      }

      // Check for meta tags
      if (indexContent.includes('<meta') && indexContent.includes('viewport')) {
        this.logTest('Meta tags', 'pass', 'Essential meta tags present');
      } else {
        this.logTest('Meta tags', 'warn', 'Missing essential meta tags');
      }
    } else {
      this.logTest('Index page', 'fail', 'index.html not found');
    }

    // Test 404.html for SPA routing
    const notFoundPath = join(outputPath, '404.html');
    if (existsSync(notFoundPath)) {
      const notFoundContent = readFileSync(notFoundPath, 'utf8');
      if (notFoundContent.includes('<html')) {
        this.logTest('SPA routing fallback', 'pass', '404.html exists and valid');
      } else {
        this.logTest('SPA routing fallback', 'warn', '404.html exists but may be invalid');
      }
    } else {
      this.logTest('SPA routing fallback', 'fail', '404.html not found');
    }

    // Test asset files
    const assetsPath = join(outputPath, 'assets');
    if (existsSync(assetsPath)) {
      const assetResult = await this.runCommand(`find ${testConfig.outputDir}/assets -name "*.js" | wc -l`, {
        silent: true,
      });
      if (assetResult.success) {
        const jsCount = parseInt(assetResult.output.trim());
        if (jsCount > 0) {
          this.logTest('JavaScript assets', 'pass', `${jsCount} JS files`);
        } else {
          this.logTest('JavaScript assets', 'fail', 'No JS files found');
        }
      }

      const cssResult = await this.runCommand(`find ${testConfig.outputDir}/assets -name "*.css" | wc -l`, {
        silent: true,
      });
      if (cssResult.success) {
        const cssCount = parseInt(cssResult.output.trim());
        if (cssCount > 0) {
          this.logTest('CSS assets', 'pass', `${cssCount} CSS files`);
        } else {
          this.logTest('CSS assets', 'warn', 'No CSS files found');
        }
      }
    } else {
      this.logTest('Asset directory', 'fail', 'assets directory not found');
    }
  }

  async testDeploymentConfiguration() {
    this.log('\n⚙️ Testing Deployment Configuration', 'bright');

    // Test GitHub Actions workflow
    const workflowPath = join(projectRoot, '.github/workflows/deploy.yml');
    if (existsSync(workflowPath)) {
      const workflowContent = readFileSync(workflowPath, 'utf8');

      // Check for required triggers
      if (workflowContent.includes('push:') && workflowContent.includes('workflow_dispatch:')) {
        this.logTest('Workflow triggers', 'pass', 'Both automatic and manual triggers configured');
      } else {
        this.logTest('Workflow triggers', 'fail', 'Missing required triggers');
      }

      // Check for GitHub Pages deployment
      if (workflowContent.includes('peaceiris/actions-gh-pages') || workflowContent.includes('pages-deploy-action')) {
        this.logTest('GitHub Pages deployment', 'pass', 'Deployment action configured');
      } else {
        this.logTest('GitHub Pages deployment', 'fail', 'No deployment action found');
      }

      // Check for build steps
      if (workflowContent.includes('npm ci') && workflowContent.includes('generate')) {
        this.logTest('Build steps', 'pass', 'Dependencies and build steps configured');
      } else {
        this.logTest('Build steps', 'fail', 'Missing build steps');
      }
    } else {
      this.logTest('GitHub Actions workflow', 'fail', 'deploy.yml not found');
    }

    // Test Nuxt configuration
    const nuxtConfigPath = join(projectRoot, 'nuxt.config.ts');
    if (existsSync(nuxtConfigPath)) {
      const nuxtConfig = readFileSync(nuxtConfigPath, 'utf8');

      // Check for static generation config
      if (nuxtConfig.includes('prerender') || nuxtConfig.includes('generate')) {
        this.logTest('Static generation config', 'pass', 'Prerender configuration found');
      } else {
        this.logTest('Static generation config', 'warn', 'Static generation config not explicit');
      }

      // Check for base URL configuration
      if (nuxtConfig.includes('baseURL') || nuxtConfig.includes('NUXT_APP_BASE_URL')) {
        this.logTest('Base URL configuration', 'pass', 'Base URL configuration found');
      } else {
        this.logTest('Base URL configuration', 'warn', 'Base URL configuration not found');
      }
    } else {
      this.logTest('Nuxt configuration', 'fail', 'nuxt.config.ts not found');
    }
  }

  async testManualDeploymentTrigger() {
    this.log('\n🚀 Testing Manual Deployment Configuration', 'bright');

    const workflowPath = join(projectRoot, '.github/workflows/deploy.yml');
    if (existsSync(workflowPath)) {
      const workflowContent = readFileSync(workflowPath, 'utf8');

      // Check for workflow_dispatch with inputs
      if (workflowContent.includes('workflow_dispatch:') && workflowContent.includes('inputs:')) {
        this.logTest('Manual trigger inputs', 'pass', 'Manual deployment inputs configured');

        // Check for specific inputs
        const hasEnvironmentInput = workflowContent.includes('environment:');
        const hasBranchInput = workflowContent.includes('branch:');

        if (hasEnvironmentInput && hasBranchInput) {
          this.logTest('Deployment customization', 'pass', 'Environment and branch selection available');
        } else {
          this.logTest('Deployment customization', 'warn', 'Limited customization options');
        }
      } else {
        this.logTest('Manual trigger configuration', 'fail', 'Manual trigger not properly configured');
      }
    }
  }

  async testDeploymentMonitoring() {
    this.log('\n📊 Testing Deployment Monitoring', 'bright');

    // Test deployment status script
    const statusScriptPath = join(projectRoot, 'scripts/check-deployment-status.js');
    if (existsSync(statusScriptPath)) {
      this.logTest('Deployment status script', 'pass', 'Status monitoring script exists');

      // Test if script is executable
      const testResult = await this.runCommand('node scripts/check-deployment-status.js --help', { silent: true });
      if (testResult.success || testResult.output.includes('help') || testResult.output.includes('usage')) {
        this.logTest('Status script functionality', 'pass', 'Script appears functional');
      } else {
        this.logTest('Status script functionality', 'warn', 'Script may have issues');
      }
    } else {
      this.logTest('Deployment status script', 'warn', 'Status monitoring script not found');
    }

    // Test build optimization script
    const buildCheckPath = join(projectRoot, 'scripts/check-build-optimization.js');
    if (existsSync(buildCheckPath)) {
      this.logTest('Build optimization script', 'pass', 'Build optimization script exists');
    } else {
      this.logTest('Build optimization script', 'warn', 'Build optimization script not found');
    }

    // Check for README deployment documentation
    const readmePath = join(projectRoot, 'README.md');
    if (existsSync(readmePath)) {
      const readmeContent = readFileSync(readmePath, 'utf8');
      if (readmeContent.includes('deploy') || readmeContent.includes('GitHub Pages')) {
        this.logTest('Deployment documentation', 'pass', 'Deployment info in README');
      } else {
        this.logTest('Deployment documentation', 'warn', 'Limited deployment documentation');
      }
    }
  }

  async runAllTests() {
    this.log('🧪 GitHub Pages Deployment Workflow Test', 'bright');
    this.log('='.repeat(50), 'cyan');

    try {
      await this.testEnvironmentSetup();

      const buildSuccess = await this.testBuildProcess();
      if (buildSuccess) {
        await this.testBuildOutput();
        await this.testApplicationFunctionality();
      }

      await this.testDeploymentConfiguration();
      await this.testManualDeploymentTrigger();
      await this.testDeploymentMonitoring();
    } catch (error) {
      this.log(`\n❌ Test execution failed: ${error.message}`, 'red');
      this.results.failed++;
    }

    this.printSummary();
    return this.results.failed === 0;
  }

  printSummary() {
    const totalTime = Math.round((Date.now() - this.startTime) / 1000);

    this.log('\n📋 Test Summary', 'bright');
    this.log('='.repeat(50), 'cyan');

    this.log(`✅ Passed: ${this.results.passed}`, 'green');
    this.log(`❌ Failed: ${this.results.failed}`, 'red');
    this.log(`⚠️  Warnings: ${this.results.warnings}`, 'yellow');
    this.log(`⏱️  Total time: ${totalTime}s`, 'cyan');

    if (this.results.failed > 0) {
      this.log('\n❌ Failed Tests:', 'red');
      this.results.tests
        .filter((test) => test.status === 'fail')
        .forEach((test) => {
          this.log(`  • ${test.name}: ${test.details}`, 'red');
        });
    }

    if (this.results.warnings > 0) {
      this.log('\n⚠️  Warnings:', 'yellow');
      this.results.tests
        .filter((test) => test.status === 'warn')
        .forEach((test) => {
          this.log(`  • ${test.name}: ${test.details}`, 'yellow');
        });
    }

    this.log('\n🎯 Recommendations:', 'bright');
    if (this.results.failed === 0) {
      this.log('✅ Deployment workflow is ready for production!', 'green');
      this.log('• You can now push to main branch for automatic deployment', 'green');
      this.log('• Manual deployments can be triggered from GitHub Actions tab', 'green');
    } else {
      this.log('❌ Fix the failed tests before deploying to production', 'red');
      this.log('• Review the GitHub Actions workflow configuration', 'yellow');
      this.log('• Ensure all required dependencies are installed', 'yellow');
      this.log('• Check Nuxt configuration for static generation', 'yellow');
    }
  }
}

// Run the tests
const tester = new DeploymentTester();
const success = await tester.runAllTests();

process.exit(success ? 0 : 1);
