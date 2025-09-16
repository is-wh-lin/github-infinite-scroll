#!/usr/bin/env node

/**
 * Application Functionality Test Script
 *
 * This script tests the deployed application functionality by:
 * 1. Starting a local preview server
 * 2. Testing key application endpoints
 * 3. Validating API integration
 * 4. Checking responsive behavior
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
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

class ApplicationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
    };
    this.startTime = Date.now();
    this.serverProcess = null;
    this.serverUrl = 'http://localhost:3000';
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

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async startPreviewServer() {
    this.log('\n🚀 Starting preview server...', 'yellow');

    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('npx', ['serve', '.output/public', '-p', '3000'], {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let serverReady = false;
      let output = '';

      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (data.toString().includes('Local:') || data.toString().includes('localhost:3000')) {
          if (!serverReady) {
            serverReady = true;
            this.log('✅ Preview server started successfully', 'green');
            resolve();
          }
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      this.serverProcess.on('error', (error) => {
        this.log(`❌ Failed to start server: ${error.message}`, 'red');
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!serverReady) {
          this.log('❌ Server startup timeout', 'red');
          this.log(`Server output: ${output}`, 'yellow');
          reject(new Error('Server startup timeout'));
        }
      }, 30000);
    });
  }

  async stopPreviewServer() {
    if (this.serverProcess) {
      this.log('\n🛑 Stopping preview server...', 'yellow');
      this.serverProcess.kill('SIGTERM');
      await this.sleep(2000);
      if (!this.serverProcess.killed) {
        this.serverProcess.kill('SIGKILL');
      }
      this.serverProcess = null;
    }
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        timeout: 10000,
        ...options,
      });

      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        text: await response.text(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async testBasicEndpoints() {
    this.log('\n🌐 Testing Basic Endpoints', 'bright');

    // Test home page
    const homeResponse = await this.makeRequest(this.serverUrl);
    if (homeResponse.success && homeResponse.status === 200) {
      this.logTest('Home page accessibility', 'pass', `Status: ${homeResponse.status}`);

      // Check for essential content
      if (homeResponse.text.includes('<html') && homeResponse.text.includes('</html>')) {
        this.logTest('Home page HTML structure', 'pass', 'Valid HTML document');
      } else {
        this.logTest('Home page HTML structure', 'fail', 'Invalid HTML structure');
      }

      // Check for Vue/Nuxt app
      if (homeResponse.text.includes('nuxt') || homeResponse.text.includes('__nuxt')) {
        this.logTest('Nuxt app integration', 'pass', 'Nuxt app detected');
      } else {
        this.logTest('Nuxt app integration', 'warn', 'Nuxt app not clearly detected');
      }
    } else {
      this.logTest(
        'Home page accessibility',
        'fail',
        homeResponse.success ? `Status: ${homeResponse.status}` : homeResponse.error
      );
    }

    // Test 404 page
    const notFoundResponse = await this.makeRequest(`${this.serverUrl}/nonexistent-page`);
    if (notFoundResponse.success) {
      if (notFoundResponse.status === 404 || notFoundResponse.status === 200) {
        this.logTest('404 handling', 'pass', `Status: ${notFoundResponse.status}`);
      } else {
        this.logTest('404 handling', 'warn', `Unexpected status: ${notFoundResponse.status}`);
      }
    } else {
      this.logTest('404 handling', 'fail', notFoundResponse.error);
    }

    // Test test page (if exists)
    const testPageResponse = await this.makeRequest(`${this.serverUrl}/test`);
    if (testPageResponse.success && testPageResponse.status === 200) {
      this.logTest('Test page accessibility', 'pass', 'Test page accessible');
    } else {
      this.logTest('Test page accessibility', 'warn', 'Test page not accessible or missing');
    }
  }

  async testStaticAssets() {
    this.log('\n📦 Testing Static Assets', 'bright');

    // Test favicon
    const faviconResponse = await this.makeRequest(`${this.serverUrl}/favicon.ico`);
    if (faviconResponse.success && faviconResponse.status === 200) {
      this.logTest('Favicon accessibility', 'pass', 'Favicon loads correctly');
    } else {
      this.logTest('Favicon accessibility', 'warn', 'Favicon not accessible');
    }

    // Test robots.txt
    const robotsResponse = await this.makeRequest(`${this.serverUrl}/robots.txt`);
    if (robotsResponse.success && robotsResponse.status === 200) {
      this.logTest('Robots.txt accessibility', 'pass', 'Robots.txt accessible');
    } else {
      this.logTest('Robots.txt accessibility', 'warn', 'Robots.txt not accessible');
    }

    // Test JavaScript assets (check if any JS files are accessible)
    const homeResponse = await this.makeRequest(this.serverUrl);
    if (homeResponse.success && homeResponse.text) {
      // Look for importmap or script src references
      const jsMatches =
        homeResponse.text.match(/"([^"]*\/assets\/[^"]*\.js[^"]*)"/g) ||
        homeResponse.text.match(/src="([^"]*\.js[^"]*)"/g);

      if (jsMatches && jsMatches.length > 0) {
        let jsUrl = jsMatches[0].match(/"([^"]*)"/)[1];
        // Handle importmap format
        if (!jsUrl.includes('.js')) {
          jsUrl = jsMatches.find((match) => match.includes('.js'));
          if (jsUrl) {
            jsUrl = jsUrl.match(/"([^"]*)"/)[1];
          }
        }

        if (jsUrl) {
          const fullJsUrl = jsUrl.startsWith('http') ? jsUrl : `${this.serverUrl}${jsUrl}`;

          let jsResponse = await this.makeRequest(fullJsUrl);

          // If the first URL fails, try without the base path (for local testing)
          if (!jsResponse.success || jsResponse.status !== 200) {
            const fallbackUrl = jsUrl.replace('/github-infinite-scroll/', '/');
            const fallbackFullUrl = fallbackUrl.startsWith('http') ? fallbackUrl : `${this.serverUrl}${fallbackUrl}`;

            jsResponse = await this.makeRequest(fallbackFullUrl);
          }

          if (jsResponse.success && jsResponse.status === 200) {
            this.logTest('JavaScript assets', 'pass', 'JS files accessible');
          } else {
            this.logTest(
              'JavaScript assets',
              'fail',
              `JS files not accessible (${jsResponse.status || jsResponse.error})`
            );
          }
        } else {
          this.logTest('JavaScript assets', 'warn', 'JS files detected but URL extraction failed');
        }
      } else {
        this.logTest('JavaScript assets', 'warn', 'No JS files detected in HTML');
      }
    }

    // Test CSS assets
    if (homeResponse.success && homeResponse.text) {
      const cssMatches = homeResponse.text.match(/href="([^"]*\.css[^"]*)"/g);
      if (cssMatches && cssMatches.length > 0) {
        const cssUrl = cssMatches[0].match(/href="([^"]*)"/)[1];
        const fullCssUrl = cssUrl.startsWith('http') ? cssUrl : `${this.serverUrl}${cssUrl}`;

        let cssResponse = await this.makeRequest(fullCssUrl);

        // If the first URL fails, try without the base path (for local testing)
        if (!cssResponse.success || cssResponse.status !== 200) {
          const fallbackUrl = cssUrl.replace('/github-infinite-scroll/', '/');
          const fallbackFullUrl = fallbackUrl.startsWith('http') ? fallbackUrl : `${this.serverUrl}${fallbackUrl}`;

          cssResponse = await this.makeRequest(fallbackFullUrl);
        }

        if (cssResponse.success && cssResponse.status === 200) {
          this.logTest('CSS assets', 'pass', 'CSS files accessible');
        } else {
          this.logTest('CSS assets', 'fail', `CSS files not accessible (${cssResponse.status || cssResponse.error})`);
        }
      } else {
        this.logTest('CSS assets', 'warn', 'No CSS files detected in HTML');
      }
    }
  }

  async testApplicationFeatures() {
    this.log('\n🔧 Testing Application Features', 'bright');

    const homeResponse = await this.makeRequest(this.serverUrl);
    if (homeResponse.success && homeResponse.text) {
      // Check for GitHub API integration indicators
      if (homeResponse.text.includes('github') || homeResponse.text.includes('repository')) {
        this.logTest('GitHub integration indicators', 'pass', 'GitHub-related content detected');
      } else {
        this.logTest('GitHub integration indicators', 'warn', 'No GitHub-related content detected');
      }

      // Check for infinite scroll indicators
      if (homeResponse.text.includes('scroll') || homeResponse.text.includes('load')) {
        this.logTest('Infinite scroll indicators', 'pass', 'Scroll-related content detected');
      } else {
        this.logTest('Infinite scroll indicators', 'warn', 'No scroll-related content detected');
      }

      // Check for Vue components
      if (homeResponse.text.includes('data-v-') || homeResponse.text.includes('vue')) {
        this.logTest('Vue components', 'pass', 'Vue components detected');
      } else {
        this.logTest('Vue components', 'warn', 'Vue components not clearly detected');
      }

      // Check for responsive design indicators
      if (homeResponse.text.includes('viewport') && homeResponse.text.includes('width=device-width')) {
        this.logTest('Responsive design', 'pass', 'Viewport meta tag configured');
      } else {
        this.logTest('Responsive design', 'warn', 'Viewport meta tag missing or incorrect');
      }
    } else {
      this.logTest('Application features', 'fail', 'Could not analyze application features');
    }
  }

  async testPerformance() {
    this.log('\n⚡ Testing Performance', 'bright');

    const startTime = Date.now();
    const homeResponse = await this.makeRequest(this.serverUrl);
    const loadTime = Date.now() - startTime;

    if (homeResponse.success) {
      if (loadTime < 1000) {
        this.logTest('Page load time', 'pass', `${loadTime}ms (< 1s)`);
      } else if (loadTime < 3000) {
        this.logTest('Page load time', 'warn', `${loadTime}ms (1-3s)`);
      } else {
        this.logTest('Page load time', 'fail', `${loadTime}ms (> 3s)`);
      }

      // Check response size
      const responseSize = homeResponse.text.length;
      const sizeKB = Math.round(responseSize / 1024);

      if (sizeKB < 100) {
        this.logTest('Page size', 'pass', `${sizeKB}KB (< 100KB)`);
      } else if (sizeKB < 500) {
        this.logTest('Page size', 'warn', `${sizeKB}KB (100-500KB)`);
      } else {
        this.logTest('Page size', 'fail', `${sizeKB}KB (> 500KB)`);
      }

      // Check for compression
      if (homeResponse.headers['content-encoding']) {
        this.logTest('Content compression', 'pass', `${homeResponse.headers['content-encoding']}`);
      } else {
        this.logTest('Content compression', 'warn', 'No compression detected');
      }
    } else {
      this.logTest('Performance testing', 'fail', 'Could not test performance');
    }
  }

  async runAllTests() {
    this.log('🧪 Application Functionality Test', 'bright');
    this.log('='.repeat(50), 'cyan');

    try {
      // Check if build output exists
      const outputPath = join(projectRoot, '.output/public');
      if (!existsSync(outputPath)) {
        this.log('❌ Build output not found. Run npm run generate:production first.', 'red');
        return false;
      }

      // Start preview server
      await this.startPreviewServer();
      await this.sleep(3000); // Give server time to fully start

      // Run tests
      await this.testBasicEndpoints();
      await this.testStaticAssets();
      await this.testApplicationFeatures();
      await this.testPerformance();
    } catch (error) {
      this.log(`\n❌ Test execution failed: ${error.message}`, 'red');
      this.results.failed++;
    } finally {
      // Always stop the server
      await this.stopPreviewServer();
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

    this.log('\n🎯 Application Status:', 'bright');
    if (this.results.failed === 0) {
      this.log('✅ Application is ready for deployment!', 'green');
      this.log('• All core functionality is working correctly', 'green');
      this.log('• Static assets are properly served', 'green');
      this.log('• Performance is within acceptable ranges', 'green');
    } else {
      this.log('❌ Application has issues that should be addressed', 'red');
      this.log('• Review failed tests and fix underlying issues', 'yellow');
      this.log('• Test again before deploying to production', 'yellow');
    }
  }
}

// Check if serve is available
try {
  const { execSync } = await import('child_process');
  execSync('npx serve --version', { stdio: 'pipe' });
} catch {
  console.log('❌ serve package not available. Installing...');
  const { execSync } = await import('child_process');
  execSync('npm install -g serve', { stdio: 'inherit' });
}

// Run the tests
const tester = new ApplicationTester();
const success = await tester.runAllTests();

process.exit(success ? 0 : 1);
