#!/usr/bin/env node

/**
 * Test script for the SaveServe Reporting System
 * Run with: node scripts/test-reporting-system.js
 */

const { connectDB } = require('../src/lib/db');
const reportDataService = require('../src/services/reportDataService').default;
const geminiReportService = require('../src/services/geminiReportService').default;
const emailService = require('../src/services/emailService').default;
const reportGenerationService = require('../src/services/reportGenerationService').default;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${colors.bold}🧪 Testing: ${testName}${colors.reset}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testDatabaseConnection() {
  logTest('Database Connection');
  try {
    await connectDB();
    logSuccess('Database connected successfully');
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

async function testEnvironmentVariables() {
  logTest('Environment Variables');
  
  const requiredVars = [
    'GOOGLE_GEMINI_API_KEY',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'INNGEST_EVENT_KEY',
    'INNGEST_SIGNING_KEY'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      logSuccess(`${varName} is set`);
    } else {
      logError(`${varName} is missing`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

async function testDataAggregation() {
  logTest('Data Aggregation Service');
  
  try {
    // Test with mock data - in real scenario, you'd use actual user IDs
    const mockUserId = 'test-user-id';
    
    // Test provider data aggregation
    try {
      const providerData = await reportDataService.getProviderReportData(mockUserId, 'weekly');
      logSuccess('Provider data aggregation works');
    } catch (error) {
      logWarning(`Provider data aggregation: ${error.message} (expected if no data)`);
    }
    
    // Test recipient data aggregation
    try {
      const recipientData = await reportDataService.getRecipientReportData(mockUserId, 'weekly');
      logSuccess('Recipient data aggregation works');
    } catch (error) {
      logWarning(`Recipient data aggregation: ${error.message} (expected if no data)`);
    }
    
    // Test platform data aggregation
    try {
      const platformData = await reportDataService.getPlatformReportData('weekly');
      logSuccess('Platform data aggregation works');
      log(`  - Found ${platformData.platform.totalProviders} providers`);
      log(`  - Found ${platformData.platform.totalRecipients} recipients`);
    } catch (error) {
      logError(`Platform data aggregation failed: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    logError(`Data aggregation test failed: ${error.message}`);
    return false;
  }
}

async function testAIGeneration() {
  logTest('AI Report Generation');
  
  try {
    // Test with mock data
    const mockProviderData = {
      provider: { name: 'Test Provider', email: 'test@example.com' },
      period: { type: 'weekly', start: new Date().toISOString(), end: new Date().toISOString() },
      kpis: {
        totalFoodListed: 50,
        totalFoodCollected: 40,
        carbonSaved: 9.6,
        waterSaved: 500,
        wastePercentage: 20,
      },
      categoryBreakdown: [
        { category: 'Fruits', quantity: 20 },
        { category: 'Vegetables', quantity: 15 },
        { category: 'Bakery', quantity: 15 },
      ],
    };
    
    const aiReport = await geminiReportService.generateProviderReport(mockProviderData, 'weekly');
    
    if (aiReport && aiReport.length > 100) {
      logSuccess('AI report generation works');
      log(`  - Generated report length: ${aiReport.length} characters`);
      log(`  - Preview: ${aiReport.substring(0, 100)}...`);
    } else {
      logError('AI report generation returned insufficient content');
      return false;
    }
    
    return true;
  } catch (error) {
    logError(`AI generation test failed: ${error.message}`);
    return false;
  }
}

async function testEmailConfiguration() {
  logTest('Email Configuration');
  
  try {
    const testResult = await emailService.testEmailConfiguration();
    logSuccess('Email configuration is valid');
    return true;
  } catch (error) {
    logError(`Email configuration test failed: ${error.message}`);
    return false;
  }
}

async function testReportGeneration() {
  logTest('Complete Report Generation');
  
  try {
    // Test platform report generation (doesn't require specific user)
    const platformReport = await reportGenerationService.generatePlatformReport('weekly');
    
    if (platformReport && platformReport.narrative) {
      logSuccess('Platform report generation works');
      log(`  - Report ID: ${platformReport.id}`);
      log(`  - Generated at: ${platformReport.generatedAt}`);
      log(`  - Narrative length: ${platformReport.narrative.length} characters`);
    } else {
      logError('Platform report generation failed');
      return false;
    }
    
    return true;
  } catch (error) {
    logError(`Report generation test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log(`${colors.bold}🚀 SaveServe Reporting System Test Suite${colors.reset}`, 'blue');
  log('='.repeat(50));
  
  const results = {
    database: await testDatabaseConnection(),
    environment: await testEnvironmentVariables(),
    dataAggregation: await testDataAggregation(),
    aiGeneration: await testAIGeneration(),
    emailConfig: await testEmailConfiguration(),
    reportGeneration: await testReportGeneration(),
  };
  
  // Summary
  log('\n' + '='.repeat(50));
  log(`${colors.bold}📊 Test Results Summary${colors.reset}`, 'blue');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    log(`${test.padEnd(20)} ${status}`);
  });
  
  log(`\nOverall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    logSuccess('\n🎉 All tests passed! The reporting system is ready to use.');
    log('\nNext steps:');
    log('1. Start your Next.js application: npm run dev');
    log('2. Visit /api/reports/test to run web-based tests');
    log('3. Check the admin dashboard at /admin/reports');
    log('4. Test report generation in provider/recipient dashboards');
  } else {
    logError('\n🚨 Some tests failed. Please check the configuration and try again.');
    log('\nRefer to REPORTING_SYSTEM_SETUP.md for detailed setup instructions.');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  logError(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Run tests
runAllTests().catch((error) => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
