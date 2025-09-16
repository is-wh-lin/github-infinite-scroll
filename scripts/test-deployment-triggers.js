#!/usr/bin/env node

/**
 * Deployment Triggers Test Script
 *
 * This script tests the GitHub Actions deployment triggers by:
 * 1. Validating workflow configuration
 * 2. Testing trigger conditions
 * 3. Simulating deployment scenarios
 * 4. Verifying environment variable handling
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { load } from 'js-yaml';

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

class DeploymentTriggerTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
    };
    this.startTime = Date.now();
    this.workflowConfig = null;
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

  loadWorkflowConfig() {
    const workflowPath = join(projectRoot, '.github/workflows/deploy.yml');

    if (!existsSync(workflowPath)) {
      this.logTest('Workflow file exists', 'fail', 'deploy.yml not found');
      return false;
    }

    try {
      const workflowContent = readFileSync(workflowPath, 'utf8');
      this.workflowConfig = load(workflowContent);
      this.logTest('Workflow file parsing', 'pass', 'YAML parsed successfully');
      return true;
    } catch (error) {
      this.logTest('Workflow file parsing', 'fail', `YAML parsing error: ${error.message}`);
      return false;
    }
  }

  testAutomaticTrigger() {
    this.log('\n🔄 Testing Automatic Deployment Trigger', 'bright');

    if (!this.workflowConfig || !this.workflowConfig.on) {
      this.logTest('Workflow triggers configuration', 'fail', 'No triggers configured');
      return;
    }

    // Test push trigger
    if (this.workflowConfig.on.push) {
      const pushConfig = this.workflowConfig.on.push;

      if (pushConfig.branches && pushConfig.branches.includes('main')) {
        this.logTest('Push to main trigger', 'pass', 'Configured to trigger on main branch push');
      } else {
        this.logTest('Push to main trigger', 'fail', 'Not configured to trigger on main branch push');
      }

      // Check if there are path filters that might prevent deployment
      if (pushConfig.paths) {
        this.logTest('Push path filters', 'warn', `Path filters configured: ${pushConfig.paths.join(', ')}`);
      } else {
        this.logTest('Push path filters', 'pass', 'No restrictive path filters');
      }
    } else {
      this.logTest('Push trigger configuration', 'fail', 'Push trigger not configured');
    }

    // Test for pull request triggers (should not trigger deployment)
    if (this.workflowConfig.on.pull_request) {
      this.logTest('Pull request trigger', 'warn', 'PR trigger configured (may cause unwanted deployments)');
    } else {
      this.logTest('Pull request trigger', 'pass', 'No PR trigger (good for production deployments)');
    }
  }

  testManualTrigger() {
    this.log('\n🚀 Testing Manual Deployment Trigger', 'bright');

    if (!this.workflowConfig || !this.workflowConfig.on) {
      this.logTest('Manual trigger configuration', 'fail', 'No triggers configured');
      return;
    }

    // Test workflow_dispatch trigger
    if (this.workflowConfig.on.workflow_dispatch) {
      this.logTest('Manual trigger availability', 'pass', 'workflow_dispatch configured');

      const dispatchConfig = this.workflowConfig.on.workflow_dispatch;

      // Test input parameters
      if (dispatchConfig.inputs) {
        const inputs = dispatchConfig.inputs;

        // Check for branch selection
        if (inputs.branch) {
          this.logTest('Branch selection input', 'pass', 'Branch selection available');

          if (inputs.branch.default) {
            this.logTest('Default branch', 'pass', `Default: ${inputs.branch.default}`);
          } else {
            this.logTest('Default branch', 'warn', 'No default branch specified');
          }
        } else {
          this.logTest('Branch selection input', 'warn', 'No branch selection input');
        }

        // Check for environment selection
        if (inputs.environment) {
          this.logTest('Environment selection', 'pass', 'Environment selection available');

          if (inputs.environment.options && inputs.environment.options.length > 0) {
            this.logTest('Environment options', 'pass', `Options: ${inputs.environment.options.join(', ')}`);
          } else {
            this.logTest('Environment options', 'warn', 'No environment options specified');
          }
        } else {
          this.logTest('Environment selection', 'warn', 'No environment selection');
        }

        // Check for deployment message
        if (inputs.deploy_message) {
          this.logTest('Custom deployment message', 'pass', 'Custom message input available');
        } else {
          this.logTest('Custom deployment message', 'warn', 'No custom message input');
        }

        // Check for force deployment option
        if (inputs.force_deploy) {
          this.logTest('Force deployment option', 'pass', 'Force deployment available');
        } else {
          this.logTest('Force deployment option', 'warn', 'No force deployment option');
        }

        // Check for build cache control
        if (inputs.skip_build_cache) {
          this.logTest('Build cache control', 'pass', 'Cache control available');
        } else {
          this.logTest('Build cache control', 'warn', 'No cache control option');
        }
      } else {
        this.logTest('Manual trigger inputs', 'warn', 'No input parameters configured');
      }
    } else {
      this.logTest('Manual trigger availability', 'fail', 'workflow_dispatch not configured');
    }
  }

  testWorkflowPermissions() {
    this.log('\n🔐 Testing Workflow Permissions', 'bright');

    if (!this.workflowConfig) {
      this.logTest('Permissions configuration', 'fail', 'No workflow configuration');
      return;
    }

    // Test permissions
    if (this.workflowConfig.permissions) {
      const permissions = this.workflowConfig.permissions;

      // Check for required permissions
      const requiredPermissions = {
        contents: 'read',
        pages: 'write',
        'id-token': 'write',
      };

      let allPermissionsCorrect = true;

      for (const [permission, expectedLevel] of Object.entries(requiredPermissions)) {
        if (permissions[permission] === expectedLevel) {
          this.logTest(`${permission} permission`, 'pass', `${expectedLevel} access`);
        } else if (permissions[permission]) {
          this.logTest(
            `${permission} permission`,
            'warn',
            `${permissions[permission]} access (expected ${expectedLevel})`
          );
        } else {
          this.logTest(`${permission} permission`, 'fail', `Missing ${expectedLevel} access`);
          allPermissionsCorrect = false;
        }
      }

      if (allPermissionsCorrect) {
        this.logTest('Overall permissions', 'pass', 'All required permissions configured');
      } else {
        this.logTest('Overall permissions', 'fail', 'Some required permissions missing');
      }
    } else {
      this.logTest('Permissions configuration', 'fail', 'No permissions configured');
    }

    // Test concurrency settings
    if (this.workflowConfig.concurrency) {
      const concurrency = this.workflowConfig.concurrency;

      if (concurrency.group === 'pages') {
        this.logTest('Concurrency group', 'pass', 'Pages concurrency group configured');
      } else {
        this.logTest('Concurrency group', 'warn', `Unexpected group: ${concurrency.group}`);
      }

      if (concurrency['cancel-in-progress'] === false) {
        this.logTest('Concurrency cancellation', 'pass', 'In-progress runs protected');
      } else {
        this.logTest('Concurrency cancellation', 'warn', 'In-progress runs may be cancelled');
      }
    } else {
      this.logTest('Concurrency configuration', 'warn', 'No concurrency settings');
    }
  }

  testJobConfiguration() {
    this.log('\n⚙️ Testing Job Configuration', 'bright');

    if (!this.workflowConfig || !this.workflowConfig.jobs) {
      this.logTest('Jobs configuration', 'fail', 'No jobs configured');
      return;
    }

    const jobs = this.workflowConfig.jobs;
    const jobNames = Object.keys(jobs);

    if (jobNames.length > 0) {
      this.logTest('Job definition', 'pass', `${jobNames.length} job(s) defined: ${jobNames.join(', ')}`);
    } else {
      this.logTest('Job definition', 'fail', 'No jobs defined');
      return;
    }

    // Test main deployment job
    const mainJob = jobs['build-and-deploy'] || jobs[jobNames[0]];

    if (mainJob) {
      // Test runner
      if (mainJob['runs-on'] === 'ubuntu-latest') {
        this.logTest('Job runner', 'pass', 'Ubuntu latest runner');
      } else {
        this.logTest('Job runner', 'warn', `Non-standard runner: ${mainJob['runs-on']}`);
      }

      // Test steps
      if (mainJob.steps && mainJob.steps.length > 0) {
        this.logTest('Job steps', 'pass', `${mainJob.steps.length} steps defined`);

        // Check for essential steps

        const hasCheckout = mainJob.steps.some(
          (step) =>
            (step.uses && step.uses.includes('checkout')) || (step.name && step.name.toLowerCase().includes('checkout'))
        );

        const hasNodeSetup = mainJob.steps.some(
          (step) =>
            (step.uses && step.uses.includes('setup-node')) || (step.name && step.name.toLowerCase().includes('node'))
        );

        const hasBuild = mainJob.steps.some(
          (step) =>
            (step.run && (step.run.includes('generate') || step.run.includes('build'))) ||
            (step.name && step.name.toLowerCase().includes('build'))
        );

        const hasDeploy = mainJob.steps.some(
          (step) =>
            (step.uses && step.uses.includes('gh-pages')) || (step.name && step.name.toLowerCase().includes('deploy'))
        );

        if (hasCheckout) {
          this.logTest('Checkout step', 'pass', 'Code checkout configured');
        } else {
          this.logTest('Checkout step', 'fail', 'No checkout step found');
        }

        if (hasNodeSetup) {
          this.logTest('Node.js setup', 'pass', 'Node.js setup configured');
        } else {
          this.logTest('Node.js setup', 'fail', 'No Node.js setup found');
        }

        if (hasBuild) {
          this.logTest('Build step', 'pass', 'Build step configured');
        } else {
          this.logTest('Build step', 'fail', 'No build step found');
        }

        if (hasDeploy) {
          this.logTest('Deploy step', 'pass', 'Deployment step configured');
        } else {
          this.logTest('Deploy step', 'fail', 'No deployment step found');
        }
      } else {
        this.logTest('Job steps', 'fail', 'No steps defined');
      }
    }

    // Test failure handling job
    if (jobs['handle-failure']) {
      this.logTest('Failure handling job', 'pass', 'Failure handling configured');
    } else {
      this.logTest('Failure handling job', 'warn', 'No failure handling job');
    }
  }

  testEnvironmentVariables() {
    this.log('\n🌍 Testing Environment Variables', 'bright');

    if (!this.workflowConfig || !this.workflowConfig.jobs) {
      this.logTest('Environment variables', 'fail', 'No job configuration to test');
      return;
    }

    const jobs = this.workflowConfig.jobs;
    const mainJob = jobs['build-and-deploy'] || jobs[Object.keys(jobs)[0]];

    if (!mainJob || !mainJob.steps) {
      this.logTest('Environment variables', 'fail', 'No steps to analyze');
      return;
    }

    // Find build step with environment variables
    const buildStep = mainJob.steps.find(
      (step) =>
        step.env &&
        ((step.run && step.run.includes('generate')) || (step.name && step.name.toLowerCase().includes('build')))
    );

    if (buildStep && buildStep.env) {
      const env = buildStep.env;

      // Check for essential environment variables
      const requiredEnvVars = ['NODE_ENV', 'GITHUB_TOKEN', 'NUXT_APP_BASE_URL'];

      let envVarsConfigured = 0;

      for (const envVar of requiredEnvVars) {
        if (env[envVar]) {
          this.logTest(`${envVar} configuration`, 'pass', 'Environment variable configured');
          envVarsConfigured++;
        } else {
          this.logTest(`${envVar} configuration`, 'warn', 'Environment variable not configured');
        }
      }

      // Check for GitHub API configuration
      if (env.GITHUB_API_BASE_URL) {
        this.logTest('GitHub API configuration', 'pass', 'API base URL configured');
      } else {
        this.logTest('GitHub API configuration', 'warn', 'No API base URL configuration');
      }

      // Check for deployment environment
      if (env.DEPLOYMENT_ENVIRONMENT) {
        this.logTest('Deployment environment', 'pass', 'Environment tracking configured');
      } else {
        this.logTest('Deployment environment', 'warn', 'No environment tracking');
      }

      if (envVarsConfigured >= 2) {
        this.logTest(
          'Overall environment setup',
          'pass',
          `${envVarsConfigured}/${requiredEnvVars.length} essential variables`
        );
      } else {
        this.logTest('Overall environment setup', 'fail', 'Insufficient environment configuration');
      }
    } else {
      this.logTest('Environment variables', 'warn', 'No environment variables in build step');
    }
  }

  async runAllTests() {
    this.log('🧪 Deployment Triggers Test', 'bright');
    this.log('='.repeat(50), 'cyan');

    try {
      // Load and parse workflow configuration
      if (!this.loadWorkflowConfig()) {
        this.printSummary();
        return false;
      }

      // Run all tests
      this.testAutomaticTrigger();
      this.testManualTrigger();
      this.testWorkflowPermissions();
      this.testJobConfiguration();
      this.testEnvironmentVariables();
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

    this.log('\n🎯 Deployment Readiness:', 'bright');
    if (this.results.failed === 0) {
      this.log('✅ Deployment triggers are properly configured!', 'green');
      this.log('• Automatic deployment will work on push to main', 'green');
      this.log('• Manual deployment is available with customization options', 'green');
      this.log('• Proper permissions and security are configured', 'green');
    } else {
      this.log('❌ Deployment configuration has critical issues', 'red');
      this.log('• Fix failed tests before attempting deployment', 'yellow');
      this.log('• Review GitHub Actions workflow configuration', 'yellow');
      this.log('• Ensure all required permissions are granted', 'yellow');
    }

    if (this.results.warnings > 0) {
      this.log('\n💡 Recommendations:', 'bright');
      this.log('• Review warnings to optimize deployment workflow', 'yellow');
      this.log('• Consider adding missing optional configurations', 'yellow');
      this.log('• Test deployment in a development environment first', 'yellow');
    }
  }
}

// Install js-yaml if not available
try {
  await import('js-yaml');
} catch {
  console.log('❌ js-yaml not available. Installing...');
  const { execSync } = await import('child_process');
  execSync('npm install js-yaml', { stdio: 'inherit', cwd: projectRoot });
}

// Run the tests
const tester = new DeploymentTriggerTester();
const success = await tester.runAllTests();

process.exit(success ? 0 : 1);
