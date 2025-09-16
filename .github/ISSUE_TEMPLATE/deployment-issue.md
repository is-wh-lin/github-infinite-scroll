---
name: Deployment Issue
about: Report problems with GitHub Pages deployment
title: '[DEPLOYMENT] '
labels: ['deployment', 'bug']
assignees: ''
---

## Deployment Issue Description

**Brief description of the issue:**

<!-- Describe what went wrong with the deployment -->

## Deployment Information

**Workflow Run:**

<!-- Link to the failed GitHub Actions workflow run -->

**Branch:**

<!-- Which branch was being deployed -->

**Trigger:**

<!-- Was this automatic (push) or manual deployment? -->

**Environment:**

<!-- production/staging/development -->

## Error Details

**Build Logs:**

```
<!-- Paste relevant error messages from the workflow logs -->
```

**Expected Behavior:**

<!-- What should have happened -->

**Actual Behavior:**

<!-- What actually happened -->

## Status Check Results

**Run the deployment status checker and paste results:**

```bash
npm run deployment:status
```

```
<!-- Paste the output here -->
```

## Environment

- **Node.js version:** <!-- e.g., 20.x -->
- **Nuxt version:** <!-- e.g., 4.1.2 -->
- **Browser:** <!-- If site accessibility issue -->
- **Operating System:** <!-- If relevant -->

## Additional Context

**Screenshots:**

<!-- Add screenshots if applicable -->

**Related Issues:**

<!-- Link to any related issues -->

**Attempted Solutions:**

<!-- What have you tried to fix this? -->

## Checklist

- [ ] I have checked the [deployment troubleshooting guide](../README.md#deployment-troubleshooting)
- [ ] I have run `npm run deployment:status` and included the output
- [ ] I have checked the GitHub Actions workflow logs
- [ ] I have verified GitHub Pages is enabled in repository settings
- [ ] I have checked that all required environment variables are configured
