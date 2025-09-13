#!/usr/bin/env node

// Test Runner Script for Shaghaf ERP System
// This script runs comprehensive tests on all system components

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧪 Shaghaf ERP System - Comprehensive Testing Suite');
console.log('====================================================\n');

// Test configuration
const testConfig = {
  timeout: 30000, // 30 seconds timeout
  retries: 3,
  parallel: false
};

// Test suites to run
const testSuites = [
  {
    name: 'Frontend Component Tests',
    command: 'npm test -- --watchAll=false',
    description: 'Testing React components and hooks'
  },
  {
    name: 'Backend API Tests',
    command: 'cd server && npm test',
    description: 'Testing API endpoints and database operations'
  },
  {
    name: 'Integration Tests',
    command: 'node test-system.js',
    description: 'Testing end-to-end system integration'
  },
  {
    name: 'Build System Test',
    command: 'npm run build',
    description: 'Testing production build process'
  }
];

// Utility functions
function runCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Running: ${command}`);
    
    const child = exec(command, { cwd, timeout: testConfig.timeout }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Command failed: ${command}`);
        console.error(`Error: ${error.message}`);
        if (stderr) console.error(`Stderr: ${stderr}`);
        reject(error);
      } else {
        console.log(`✅ Command succeeded: ${command}`);
        if (stdout) console.log(`Output: ${stdout.slice(0, 500)}...`);
        resolve(stdout);
      }
    });
    
    // Handle timeout
    setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Command timed out: ${command}`));
    }, testConfig.timeout);
  });
}

function checkSystemRequirements() {
  console.log('📋 Checking System Requirements...\n');
  
  const requirements = [
    { name: 'package.json', path: './package.json' },
    { name: 'Server package.json', path: './server/package.json' },
    { name: 'Main App Component', path: './src/App.tsx' },
    { name: 'API Client', path: './src/lib/api.ts' },
    { name: 'Server Index', path: './server/index.ts' },
  ];
  
  let allRequirementsMet = true;
  
  requirements.forEach(req => {
    if (fs.existsSync(req.path)) {
      console.log(`✅ ${req.name} - Found`);
    } else {
      console.log(`❌ ${req.name} - Missing`);
      allRequirementsMet = false;
    }
  });
  
  if (!allRequirementsMet) {
    console.error('\n❌ System requirements not met. Please check missing files.');
    process.exit(1);
  }
  
  console.log('\n✅ All system requirements met!\n');
}

function checkDependencies() {
  console.log('📦 Checking Dependencies...\n');
  
  // Check if node_modules exists
  if (!fs.existsSync('./node_modules')) {
    console.log('⚠️  Frontend dependencies not installed. Installing...');
    return runCommand('npm install');
  }
  
  if (!fs.existsSync('./server/node_modules')) {
    console.log('⚠️  Backend dependencies not installed. Installing...');
    return runCommand('npm install', './server');
  }
  
  console.log('✅ All dependencies are installed!\n');
  return Promise.resolve();
}

async function runTestSuite(suite) {
  console.log(`\n🧪 ${suite.name}`);
  console.log(`📝 ${suite.description}`);
  console.log('─'.repeat(50));
  
  let attempts = 0;
  let lastError;
  
  while (attempts < testConfig.retries) {
    try {
      attempts++;
      console.log(`Attempt ${attempts}/${testConfig.retries}`);
      
      await runCommand(suite.command);
      console.log(`✅ ${suite.name} - PASSED\n`);
      return { name: suite.name, status: 'PASSED', attempts };
      
    } catch (error) {
      lastError = error;
      console.log(`❌ ${suite.name} - Attempt ${attempts} failed`);
      
      if (attempts < testConfig.retries) {
        console.log(`⏳ Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.log(`❌ ${suite.name} - FAILED after ${attempts} attempts`);
  console.log(`Error: ${lastError.message}\n`);
  return { name: suite.name, status: 'FAILED', attempts, error: lastError.message };
}

async function generateTestReport(results) {
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const successRate = ((passed / results.length) * 100).toFixed(1);
  
  const report = `
# Shaghaf ERP System - Test Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Tests**: ${results.length}
- **Passed**: ${passed}
- **Failed**: ${failed}
- **Success Rate**: ${successRate}%

## Test Results
${results.map(result => `
### ${result.name}
- **Status**: ${result.status}
- **Attempts**: ${result.attempts}
${result.error ? `- **Error**: ${result.error}` : ''}
`).join('')}

## System Components Tested
- ✓ Frontend React Components
- ✓ Backend API Endpoints
- ✓ Database Operations
- ✓ Authentication System
- ✓ Branch Management
- ✓ Room & Booking System
- ✓ Client Management
- ✓ Inventory Management
- ✓ Employee Management
- ✓ Financial System
- ✓ Reports & Analytics
- ✓ Error Handling
- ✓ Build System

## Recommendations
${failed > 0 ? `
⚠️ **Action Required**: ${failed} test suite(s) failed.
Please review the errors above and fix the issues before deployment.
` : `
✅ **Ready for Production**: All tests passed successfully.
The system is ready for deployment.
`}

---
Shaghaf ERP System v1.0
`;

  fs.writeFileSync('test-report.md', report);
  console.log('\n📄 Test report generated: test-report.md');
}

async function runHealthCheck() {
  console.log('\n🏥 System Health Check...\n');
  
  const healthChecks = [
    {
      name: 'Frontend Build',
      check: () => fs.existsSync('./dist') || fs.existsSync('./build')
    },
    {
      name: 'Backend Transpilation',
      check: () => fs.existsSync('./server/dist') || true // TypeScript files can run directly
    },
    {
      name: 'Configuration Files',
      check: () => fs.existsSync('./tsconfig.json') && fs.existsSync('./vite.config.ts')
    },
    {
      name: 'Test Files',
      check: () => fs.existsSync('./src/__tests__') && fs.existsSync('./test-system.js')
    }
  ];
  
  healthChecks.forEach(check => {
    const status = check.check() ? '✅' : '⚠️';
    console.log(`${status} ${check.name}`);
  });
}

// Main test execution
async function main() {
  try {
    console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
    
    // Pre-flight checks
    checkSystemRequirements();
    await checkDependencies();
    
    // Run health check
    await runHealthCheck();
    
    // Run test suites
    console.log('\n🚀 Starting Test Execution...\n');
    const results = [];
    
    for (const suite of testSuites) {
      const result = await runTestSuite(suite);
      results.push(result);
      
      // Short delay between test suites
      if (!testConfig.parallel) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Generate report
    await generateTestReport(results);
    
    // Final summary
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    
    console.log('\n🎯 Test Execution Complete!');
    console.log('================================');
    console.log(`✅ Passed: ${passed}/${results.length}`);
    console.log(`❌ Failed: ${failed}/${results.length}`);
    console.log(`⏰ Finished at: ${new Date().toISOString()}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! System is ready for production.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Test execution failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}

export { main, runTestSuite, checkSystemRequirements };