#!/usr/bin/env node
/**
 * Diagnostic script to test Firebase/MongoDB connection
 * Run with: node test-firebase-connection.js
 */

const { adminDb, adminAuth } = require('./lib/firebase-admin')

async function testConnection() {
  console.log('\n=== Firebase Connection Diagnostics ===\n')

  // Check environment variables
  console.log('Environment Configuration:')
  console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Not set')
  console.log('  FIRESTORE_MONGODB_URI:', process.env.FIRESTORE_MONGODB_URI ? '✓ Set' : '✗ Not set')
  console.log('  GCP_SERVICE_ACCOUNT:', process.env.GCP_SERVICE_ACCOUNT ? '✓ Set' : '✗ Not set')
  console.log('  MONGODB_USE_GCP_METADATA:', process.env.MONGODB_USE_GCP_METADATA || 'Not set')

  // Test admin auth
  console.log('\nAdmin Auth:')
  try {
    console.log('  adminAuth:', adminAuth ? '✓ Initialized' : '✗ Not initialized')
  } catch (error) {
    console.error('  ✗ Error checking adminAuth:', error.message)
  }

  // Test database connection
  console.log('\nDatabase Connection:')
  try {
    console.log('  adminDb:', adminDb ? '✓ Initialized' : '✗ Not initialized')
    
    // Try a simple read
    const testRead = await adminDb.collection('_test').limit(1).get()
    console.log('  ✓ Test read successful')
  } catch (error) {
    console.error('  ✗ Test read failed:', error.message)
    console.error('    Error details:', error.toString())
  }

  // Try a test write
  console.log('\nDatabase Write Test:')
  try {
    const testId = `test_${Date.now()}`
    const testData = {
      testField: 'test_value',
      timestamp: new Date(),
    }
    
    await adminDb.collection('_test').doc(testId).set(testData)
    console.log('  ✓ Test write successful')
    
    // Clean up
    await adminDb.collection('_test').doc(testId).delete()
    console.log('  ✓ Test cleanup successful')
  } catch (error) {
    console.error('  ✗ Test write failed:', error.message)
    console.error('    Error details:', error.toString())
  }

  console.log('\n=== End Diagnostics ===\n')
}

// Run diagnostics
testConnection().catch(error => {
  console.error('Fatal error during diagnostics:', error)
  process.exit(1)
})
