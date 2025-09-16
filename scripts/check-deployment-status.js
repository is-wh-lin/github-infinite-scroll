#!/usr/bin/env node

/**
 * Deployment Status Checker
 *
 * This script checks the current deployment status of the GitHub Pages site
 * and provides information about the latest deployment.
 */

import https from 'https';

// Configuration
const GITHUB_OWNER = process.env.GITHUB_REPOSITORY_OWNER || 'is-wh-lin';
const GITHUB_REPO = process.env.GITHUB_REPOSITORY_NAME || 'github-infinite-scroll';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * Make HTTP request to GitHub API
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'deployment-status-checker',
        Accept: 'application/vnd.github.v3+json',
        ...(GITHUB_TOKEN && { Authorization: `token ${GITHUB_TOKEN}` }),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Get latest workflow run status
 */
async function getWorkflowStatus() {
  try {
    const runs = await makeRequest(
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/deploy.yml/runs?per_page=1`
    );

    if (runs.workflow_runs && runs.workflow_runs.length > 0) {
      const latestRun = runs.workflow_runs[0];
      return {
        status: latestRun.status,
        conclusion: latestRun.conclusion,
        created_at: latestRun.created_at,
        updated_at: latestRun.updated_at,
        html_url: latestRun.html_url,
        head_branch: latestRun.head_branch,
        head_sha: latestRun.head_sha.substring(0, 7),
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Failed to fetch workflow status:', error.message);
    return null;
  }
}

/**
 * Get GitHub Pages status
 */
async function getPagesStatus() {
  try {
    const pages = await makeRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pages`);
    return {
      status: pages?.status || 'unknown',
      url: pages?.html_url || `https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}`,
      source: pages?.source || { branch: 'gh-pages', path: '/' },
      updated_at: pages?.updated_at || null,
    };
  } catch (error) {
    console.error('❌ Failed to fetch Pages status:', error.message);
    return {
      status: 'not_configured',
      url: `https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}`,
      source: { branch: 'gh-pages', path: '/' },
      updated_at: null,
    };
  }
}

/**
 * Get latest commit on gh-pages branch
 */
async function getGhPagesCommit() {
  try {
    const commit = await makeRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits/gh-pages`);
    return {
      sha: commit?.sha?.substring(0, 7) || 'unknown',
      message: commit?.commit?.message?.split('\n')[0] || 'No commit message',
      date: commit?.commit?.committer?.date || null,
      author: commit?.commit?.author?.name || 'unknown',
    };
  } catch (error) {
    console.error('❌ Failed to fetch gh-pages commit:', error.message);
    return {
      sha: 'unknown',
      message: 'No gh-pages branch found',
      date: null,
      author: 'unknown',
    };
  }
}

/**
 * Check if site is accessible
 */
async function checkSiteAccessibility() {
  const siteUrl = `https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}`;

  return new Promise((resolve) => {
    const options = {
      hostname: `${GITHUB_OWNER}.github.io`,
      path: `/${GITHUB_REPO}`,
      method: 'HEAD',
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      resolve({
        accessible: res.statusCode >= 200 && res.statusCode < 400,
        statusCode: res.statusCode,
        url: siteUrl,
      });
    });

    req.on('error', () => {
      resolve({
        accessible: false,
        statusCode: null,
        url: siteUrl,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        accessible: false,
        statusCode: 'timeout',
        url: siteUrl,
      });
    });

    req.end();
  });
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
}

/**
 * Get status emoji
 */
function getStatusEmoji(status, conclusion) {
  if (status === 'completed') {
    return conclusion === 'success' ? '✅' : '❌';
  }
  if (status === 'in_progress') return '🔄';
  if (status === 'queued') return '⏳';
  return '❓';
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Checking GitHub Pages deployment status...\n');

  // Get all status information
  const [workflowStatus, pagesStatus, ghPagesCommit, siteStatus] = await Promise.all([
    getWorkflowStatus(),
    getPagesStatus(),
    getGhPagesCommit(),
    checkSiteAccessibility(),
  ]);

  // Display workflow status
  if (workflowStatus) {
    const emoji = getStatusEmoji(workflowStatus.status, workflowStatus.conclusion);
    console.log('📋 Latest Deployment Workflow:');
    console.log(`   ${emoji} Status: ${workflowStatus.status} (${workflowStatus.conclusion || 'pending'})`);
    console.log(`   🌿 Branch: ${workflowStatus.head_branch}`);
    console.log(`   📝 Commit: ${workflowStatus.head_sha}`);
    console.log(`   ⏰ Updated: ${formatDate(workflowStatus.updated_at)}`);
    console.log(`   🔗 Details: ${workflowStatus.html_url}\n`);
  }

  // Display Pages status
  if (pagesStatus) {
    console.log('📄 GitHub Pages Status:');
    console.log(`   📊 Status: ${pagesStatus.status}`);
    console.log(`   🌐 URL: ${pagesStatus.url}`);
    console.log(`   📂 Source: ${pagesStatus.source.branch}/${pagesStatus.source.path || ''}`);
    console.log(`   ⏰ Updated: ${formatDate(pagesStatus.updated_at)}\n`);
  }

  // Display gh-pages branch status
  if (ghPagesCommit) {
    console.log('🌿 gh-pages Branch:');
    console.log(`   📝 Latest Commit: ${ghPagesCommit.sha}`);
    console.log(`   💬 Message: ${ghPagesCommit.message}`);
    console.log(`   👤 Author: ${ghPagesCommit.author}`);
    console.log(`   ⏰ Date: ${formatDate(ghPagesCommit.date)}\n`);
  }

  // Display site accessibility
  console.log('🌐 Site Accessibility:');
  if (siteStatus.accessible) {
    console.log(`   ✅ Site is accessible (HTTP ${siteStatus.statusCode})`);
  } else {
    console.log(`   ❌ Site is not accessible (${siteStatus.statusCode || 'connection failed'})`);
  }
  console.log(`   🔗 URL: ${siteStatus.url}\n`);

  // Summary
  const isHealthy =
    workflowStatus?.conclusion === 'success' && pagesStatus?.status === 'built' && siteStatus.accessible;

  console.log('📊 Overall Status:');
  console.log(`   ${isHealthy ? '✅ Healthy' : '⚠️  Issues detected'}`);

  if (!isHealthy) {
    console.log('\n🔧 Troubleshooting:');
    if (workflowStatus?.conclusion !== 'success') {
      console.log('   • Check workflow logs for build/deployment errors');
    }
    if (pagesStatus?.status !== 'built') {
      console.log('   • Verify GitHub Pages is enabled in repository settings');
    }
    if (!siteStatus.accessible) {
      console.log('   • Site may still be deploying or there may be DNS issues');
    }
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

export { main, getWorkflowStatus, getPagesStatus, checkSiteAccessibility };
