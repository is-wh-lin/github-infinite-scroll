#!/usr/bin/env node

/**
 * Complete Deployment Test Script
 *
 * This script runs a comprehensive test of the entire deployment workflow:
 * 1. Deployment workflow configuration
 * 2. Build process and output validation
 * 3. Application functionality testing
 * 4. Deployment trigger validation
 * 5. Final deployment readiness assessment
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

class CompleteDeploymentTester {
  constructor() {
    this.results = {
      workflow: { passed: 0, failed: 0, warnings: 0 },
      functionality: { passed: 0, failed: 0, warnings: 0 },
      triggers: { passed: 0, failed: 0, warnings: 0 },
      overall: { passed: 0, failed: 0, warnings: 0 },
    };
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async runScript(scriptPath, testName) {
    this.log(`\n🧪 Running ${testName}...`, 'bright');
    this.log('='.repeat(60), 'cyan');

    return new Promise((resolve) => {
      const process = spawn('node', [scriptPath], {
        cwd: projectRoot,
        stdio: 'inherit',
      });

      process.on('close', (code) => {
        if (code === 0) {
          this.log(`\n✅ ${testName} completed successfully`, 'green');
          resolve({ success: true, code });
        } else {
          this.log(`\n❌ ${testName} failed with exit code ${code}`, 'red');
          resolve({ success: false, code });
        }
      });

      process.on('error', (error) => {
        this.log(`\n❌ ${testName} failed to start: ${error.message}`, 'red');
        resolve({ success: false, error: error.message });
      });
    });
  }

  parseTestResults(output) {
    // Simple parsing of test results from output
    const passedMatch = output.match(/✅ Passed: (\d+)/);
    const failedMatch = output.match(/❌ Failed: (\d+)/);
    const warningsMatch = output.match(/⚠️\s+Warnings: (\d+)/);

    return {
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      warnings: warningsMatch ? parseInt(warningsMatch[1]) : 0,
    };
  }

  async runAllTests() {
    this.log('🚀 Complete GitHub Pages Deployment Test Suite', 'bright');
    this.log('='.repeat(80), 'cyan');
    this.log('This comprehensive test validates the entire deployment workflow', 'yellow');
    this.log('from configuration to final application functionality.\n', 'yellow');

    const tests = [
      {
        script: 'scripts/test-deployment-workflow.js',
        name: 'Deployment Workflow Test',
        key: 'workflow',
        description: 'Tests build process, output validation, and deployment configuration',
      },
      {
        script: 'scripts/test-application-functionality.js',
        name: 'Application Functionality Test',
        key: 'functionality',
        description: 'Tests deployed application functionality and performance',
      },
      {
        script: 'scripts/test-deployment-triggers.js',
        name: 'Deployment Triggers Test',
        key: 'triggers',
        description: 'Tests GitHub Actions workflow and trigger configuration',
      },
    ];

    let allTestsPassed = true;
    const testResults = [];

    for (const test of tests) {
      this.log(`\n📋 ${test.name}`, 'bright');
      this.log(`Description: ${test.description}`, 'cyan');

      if (!existsSync(join(projectRoot, test.script))) {
        this.log(`❌ Test script not found: ${test.script}`, 'red');
        allTestsPassed = false;
        testResults.push({ ...test, success: false, error: 'Script not found' });
        continue;
      }

      const result = await this.runScript(test.script, test.name);
      testResults.push({ ...test, ...result });

      if (!result.success) {
        allTestsPassed = false;
      }

      // Add a separator between tests
      this.log('\n' + '─'.repeat(80), 'cyan');
    }

    this.printFinalSummary(testResults, allTestsPassed);
    return allTestsPassed;
  }

  printFinalSummary(testResults, allTestsPassed) {
    const totalTime = Math.round((Date.now() - this.startTime) / 1000);

    this.log('\n🎯 FINAL DEPLOYMENT READINESS ASSESSMENT', 'bright');
    this.log('='.repeat(80), 'cyan');

    // Test results summary
    this.log('\n📊 Test Results Summary:', 'bright');
    testResults.forEach((test) => {
      const status = test.success ? '✅ PASSED' : '❌ FAILED';
      const color = test.success ? 'green' : 'red';
      this.log(`  ${status} - ${test.name}`, color);
      if (!test.success && test.error) {
        this.log(`    Error: ${test.error}`, 'red');
      }
    });

    // Overall assessment
    this.log(`\n⏱️  Total execution time: ${totalTime}s`, 'cyan');

    if (allTestsPassed) {
      this.log('\n🎉 DEPLOYMENT READY!', 'green');
      this.log('='.repeat(40), 'green');
      this.log('✅ All tests passed successfully', 'green');
      this.log('✅ Build process is working correctly', 'green');
      this.log('✅ Application functionality is validated', 'green');
      this.log('✅ Deployment triggers are properly configured', 'green');
      this.log('✅ GitHub Actions workflow is ready for production', 'green');

      this.log('\n🚀 Next Steps:', 'bright');
      this.log('1. Push your changes to the main branch for automatic deployment', 'green');
      this.log('2. Or trigger a manual deployment from GitHub Actions tab', 'green');
      this.log('3. Monitor the deployment process in GitHub Actions', 'green');
      this.log('4. Verify the deployed site at your GitHub Pages URL', 'green');

      this.log('\n📍 GitHub Pages URL:', 'bright');
      this.log('https://is-wh-lin.github.io/github-infinite-scroll', 'cyan');
    } else {
      this.log('\n❌ DEPLOYMENT NOT READY', 'red');
      this.log('='.repeat(40), 'red');
      this.log('Some tests failed. Please address the issues before deploying.', 'red');

      this.log('\n🔧 Troubleshooting Steps:', 'bright');
      this.log('1. Review the failed test outputs above', 'yellow');
      this.log('2. Fix any configuration or code issues', 'yellow');
      this.log('3. Re-run this test suite to verify fixes', 'yellow');
      this.log('4. Only deploy after all tests pass', 'yellow');

      const failedTests = testResults.filter((test) => !test.success);
      if (failedTests.length > 0) {
        this.log('\n❌ Failed Tests:', 'red');
        failedTests.forEach((test) => {
          this.log(`  • ${test.name}`, 'red');
          if (test.error) {
            this.log(`    ${test.error}`, 'red');
          }
        });
      }
    }

    this.log('\n📚 Additional Resources:', 'bright');
    this.log('• GitHub Pages Documentation: https://docs.github.com/en/pages', 'cyan');
    this.log('• Nuxt Deployment Guide: https://nuxt.com/docs/getting-started/deployment', 'cyan');
    this.log('• GitHub Actions Documentation: https://docs.github.com/en/actions', 'cyan');

    this.log('\n💡 Tips:', 'bright');
    this.log('• Run individual test scripts for focused debugging', 'yellow');
    this.log('• Check GitHub repository settings for Pages configuration', 'yellow');
    this.log('• Ensure all required secrets and variables are set', 'yellow');
    this.log('• Monitor GitHub Actions logs for deployment issues', 'yellow');

    this.log('\n' + '='.repeat(80), 'cyan');

    if (allTestsPassed) {
      this.log('🎊 Congratulations! Your deployment workflow is ready for production! 🎊', 'green');
    } else {
      this.log('🔧 Please fix the issues above and run the tests again. 🔧', 'yellow');
    }
  }
}

// Main execution
async function main() {
  const tester = new CompleteDeploymentTester();

  try {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(`❌ Test suite execution failed: ${error.message}`);
    process.exit(1);
  }
}

main();
