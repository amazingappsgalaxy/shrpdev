# Git Checkpoint and Restoration Workflow

## Overview
This document outlines the workflow for handling Git repository issues, particularly when dealing with secret detection, push rejections, and repository cleanup.

## Common Issues and Solutions

### 1. Push Rejection Due to Secrets in Commit History

**Problem**: Repository rules detect hardcoded secrets (API keys, tokens) in commit history, preventing pushes.

**Solution Steps**:
1. **Identify the problematic commit**:
   ```bash
   git log --oneline -10
   ```

2. **Reset to clean state**:
   ```bash
   # Reset to the last clean commit (before secrets were added)
   git reset --hard <clean_commit_hash>
   ```

3. **Clean up files locally**:
   - Remove hardcoded secrets from configuration files
   - Use environment variables or secure configuration methods
   - Update `.env.example` files with placeholder values

4. **Verify clean state**:
   ```bash
   git status
   git log --oneline -5
   ```

### 2. Branching Strategy for Safe Development

**Setup Development Branch**:
```bash
# Create and switch to development branch
git checkout -b development

# Push development branch to remote
git push -u origin development
```

**Benefits**:
- Protects main/master branch from experimental changes
- Allows safe testing of changes before merging
- Enables collaborative development without affecting production

### 3. Repository Cleanup Best Practices

**Before Making Changes**:
1. Always check current repository state:
   ```bash
   git status
   git log --oneline -5
   ```

2. Create a backup branch if working with sensitive changes:
   ```bash
   git checkout -b backup-$(date +%Y%m%d)
   ```

**After Issues**:
1. Verify all secrets are removed from files
2. Check that `.gitignore` includes sensitive files
3. Test push to development branch first
4. Only merge to main after verification

### 4. IDE Configuration for Git Workflow

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "git.enableSmartCommit": true,
  "git.autofetch": true,
  "git.confirmSync": false,
  "git.enableStatusBarSync": true,
  "git.postCommitCommand": "sync",
  "git.showPushSuccessNotification": true,
  "git.branchProtection": ["main", "master"],
  "git.branchProtectionPrompt": "alwaysPrompt",
  "git.requireGitSuffix": false,
  "git.useCommitInputAsStashMessage": true,
  "git.verboseCommit": true,
  "git.allowForcePush": false,
  "git.fetchOnPull": true,
  "git.pruneOnFetch": true,
  "git.pullBeforeCheckout": true,
  "git.showInlineOpenFileAction": true,
  "git.openDiffOnClick": true
}
```

### 5. Emergency Recovery Procedures

**If Rebase Fails**:
```bash
# Abort the rebase
git rebase --abort

# Return to known good state
git reset --hard origin/main
```

**If Push Continues to Fail**:
1. Check repository rules and policies
2. Contact repository administrator if needed
3. Use alternative branch for testing
4. Consider repository migration if rules are too restrictive

### 6. Prevention Strategies

**Pre-commit Checks**:
1. Use `.gitignore` for sensitive files
2. Implement pre-commit hooks for secret detection
3. Use environment variables for configuration
4. Regular security audits of codebase

**Team Guidelines**:
1. Never commit secrets or API keys
2. Use development branches for experimental work
3. Regular cleanup of old branches
4. Document configuration requirements

## Quick Reference Commands

```bash
# Check repository state
git status
git log --oneline -5

# Safe reset to clean state
git reset --hard <clean_commit_hash>

# Create development branch
git checkout -b development
git push -u origin development

# Emergency abort
git rebase --abort
git merge --abort
```

## Notes
- Always backup important work before major Git operations
- Test changes in development branch before merging to main
- Keep commit messages clear and descriptive
- Regular repository maintenance prevents major issues

---
*Last updated: $(date)*
*Repository: sharpcode*

---