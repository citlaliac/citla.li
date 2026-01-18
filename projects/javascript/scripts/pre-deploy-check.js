#!/usr/bin/env node

/**
 * Pre-deploy check script
 * Runs tests and checks for security vulnerabilities before deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, BLUE);
  console.log('='.repeat(60) + '\n');
}

function runCommand(command, description) {
  log(`\n${description}...`, YELLOW);
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error };
  }
}

function checkVulnerabilities() {
  logSection('Checking for security vulnerabilities');
  
  try {
    const auditOutput = execSync('npm audit --json', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    const audit = JSON.parse(auditOutput);
    
    if (audit.metadata && audit.metadata.vulnerabilities) {
      const vulns = audit.metadata.vulnerabilities;
      const total = vulns.info + vulns.low + vulns.moderate + vulns.high + vulns.critical;
      
      if (total > 0) {
        log(`\n❌ Found ${total} vulnerabilities:`, RED);
        if (vulns.critical > 0) log(`   Critical: ${vulns.critical}`, RED);
        if (vulns.high > 0) log(`   High: ${vulns.high}`, RED);
        if (vulns.moderate > 0) log(`   Moderate: ${vulns.moderate}`, YELLOW);
        if (vulns.low > 0) log(`   Low: ${vulns.low}`, YELLOW);
        if (vulns.info > 0) log(`   Info: ${vulns.info}`);
        
        log('\n💡 Run "npm audit fix" to fix automatically fixable issues', YELLOW);
        log('   Or review "npm audit" output for manual fixes needed', YELLOW);
        return false;
      } else {
        log('✅ No security vulnerabilities found!', GREEN);
        return true;
      }
    } else {
      log('✅ No security vulnerabilities found!', GREEN);
      return true;
    }
  } catch (error) {
    // If npm audit fails, it might be because there are vulnerabilities
    // Try to parse the error output
    try {
      const auditOutput = execSync('npm audit', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe'
      });
      // If we get here, there are no vulnerabilities
      log('✅ No security vulnerabilities found!', GREEN);
      return true;
    } catch (auditError) {
      log('❌ Security vulnerabilities detected!', RED);
      log('   Run "npm audit" to see details', YELLOW);
      return false;
    }
  }
}

// Main execution
async function main() {
  log('\n🚀 Pre-Deploy Check Starting...', BLUE);
  log('   This will run tests and check for security vulnerabilities\n');
  
  let allChecksPassed = true;
  
  // Step 1: Run tests
  logSection('Running Tests');
  const testResult = runCommand('npm run test:ci -- --no-coverage', 'Running test suite');
  if (!testResult.success) {
    log('\n❌ Tests failed! Please fix failing tests before deploying.', RED);
    allChecksPassed = false;
  } else {
    log('\n✅ All tests passed!', GREEN);
  }
  
  // Step 2: Check for vulnerabilities
  const vulnCheck = checkVulnerabilities();
  if (!vulnCheck) {
    allChecksPassed = false;
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  if (allChecksPassed) {
    log('✅ All pre-deploy checks passed! Ready to deploy.', GREEN);
    process.exit(0);
  } else {
    log('❌ Pre-deploy checks failed! Please fix issues before deploying.', RED);
    log('\nSummary:', YELLOW);
    if (!testResult.success) {
      log('  - Tests: FAILED', RED);
    } else {
      log('  - Tests: PASSED', GREEN);
    }
    if (!vulnCheck) {
      log('  - Security: VULNERABILITIES FOUND', RED);
    } else {
      log('  - Security: CLEAN', GREEN);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, RED);
  process.exit(1);
});
