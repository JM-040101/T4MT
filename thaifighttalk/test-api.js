#!/usr/bin/env node

/**
 * API Endpoint Testing Script
 * Tests all ThaiFightTalk API endpoints
 */

const BASE_URL = 'http://localhost:3000'

// Test credentials - you'll need to create this user or use an existing one
const TEST_USER = {
  email: 'test@thaifighttalk.com',
  password: 'test12345678'
}

let authToken = null

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function makeRequest(endpoint, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (authToken && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    const data = await response.json()

    return {
      status: response.status,
      ok: response.ok,
      data
    }
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    }
  }
}

async function testEndpoint(name, endpoint, options = {}) {
  log(`\n→ Testing: ${name}`, 'cyan')
  log(`  ${options.method || 'GET'} ${endpoint}`, 'blue')

  const result = await makeRequest(endpoint, options)

  if (result.ok) {
    log(`  ✓ Status: ${result.status}`, 'green')
    if (result.data.data) {
      log(`  ✓ Data received: ${JSON.stringify(result.data.data).substring(0, 100)}...`, 'green')
    }
    return result
  } else {
    log(`  ✗ Status: ${result.status}`, 'red')
    log(`  ✗ Error: ${JSON.stringify(result.data || result.error)}`, 'red')
    return result
  }
}

async function getAuthToken() {
  log('\n=== AUTHENTICATION ===', 'yellow')

  // Try to sign in
  log('\n→ Attempting to sign in with test credentials', 'cyan')
  const signInResult = await makeRequest('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify(TEST_USER),
    skipAuth: true
  })

  if (signInResult.ok && signInResult.data.session) {
    authToken = signInResult.data.session.access_token
    log('  ✓ Signed in successfully', 'green')
    return true
  }

  // If sign in fails, try to sign up
  log('\n→ Sign in failed, attempting to create new test user', 'cyan')
  const signUpResult = await makeRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      ...TEST_USER,
      display_name: 'Test User'
    }),
    skipAuth: true
  })

  if (signUpResult.ok && signUpResult.data.session) {
    authToken = signUpResult.data.session.access_token
    log('  ✓ User created and signed in successfully', 'green')
    return true
  }

  log('  ✗ Could not authenticate. Please check Supabase connection.', 'red')
  log(`  ✗ Error: ${JSON.stringify(signUpResult.data || signUpResult.error)}`, 'red')
  return false
}

async function testUnauthenticatedAccess() {
  log('\n=== TESTING UNAUTHENTICATED ACCESS ===', 'yellow')

  const tempToken = authToken
  authToken = null // Remove token temporarily

  const result = await testEndpoint(
    'Camps endpoint without auth (should fail)',
    '/api/v1/camps',
    {}
  )

  authToken = tempToken // Restore token

  if (result.status === 401) {
    log('  ✓ Correctly blocked unauthenticated access', 'green')
  } else {
    log('  ✗ Security issue: endpoint accessible without auth', 'red')
  }
}

async function runTests() {
  log('╔════════════════════════════════════════╗', 'cyan')
  log('║  ThaiFightTalk API Endpoint Tests     ║', 'cyan')
  log('╚════════════════════════════════════════╝', 'cyan')

  // Get authentication token
  const authenticated = await getAuthToken()
  if (!authenticated) {
    log('\n✗ Tests aborted: Could not authenticate', 'red')
    process.exit(1)
  }

  // Test unauthenticated access
  await testUnauthenticatedAccess()

  // Test camps endpoint
  log('\n=== TESTING CAMPS ENDPOINTS ===', 'yellow')
  const campsResult = await testEndpoint(
    'Get all camps',
    '/api/v1/camps'
  )

  let firstCampId = null
  if (campsResult.ok && campsResult.data.data && campsResult.data.data.length > 0) {
    firstCampId = campsResult.data.data[0].id
    log(`  ✓ Found ${campsResult.data.data.length} camps`, 'green')
  }

  // Test camp lessons endpoint
  if (firstCampId) {
    const lessonsResult = await testEndpoint(
      'Get lessons for first camp',
      `/api/v1/camps/${firstCampId}/lessons`
    )

    // Test lesson detail endpoint
    if (lessonsResult.ok && lessonsResult.data.data && lessonsResult.data.data.length > 0) {
      const firstLessonId = lessonsResult.data.data[0].id
      log(`  ✓ Found ${lessonsResult.data.data.length} lessons`, 'green')

      await testEndpoint(
        'Get lesson detail',
        `/api/v1/lessons/${firstLessonId}`
      )
    }
  } else {
    log('  ⚠ Skipping lessons tests - no camps found', 'yellow')
  }

  // Test badges endpoint
  log('\n=== TESTING BADGES ENDPOINT ===', 'yellow')
  const badgesResult = await testEndpoint(
    'Get all badges',
    '/api/v1/badges'
  )
  if (badgesResult.ok && badgesResult.data.data) {
    log(`  ✓ Found ${badgesResult.data.data.length} badges`, 'green')
  }

  // Test leaderboard endpoint
  log('\n=== TESTING LEADERBOARD ENDPOINT ===', 'yellow')
  await testEndpoint(
    'Get leaderboard (page 1)',
    '/api/v1/leaderboard?page=1&limit=10'
  )

  await testEndpoint(
    'Get leaderboard (page 2)',
    '/api/v1/leaderboard?page=2&limit=5'
  )

  // Test AI sparring endpoint
  log('\n=== TESTING AI SPARRING ENDPOINT ===', 'yellow')
  log('  ⚠ Note: This requires OpenAI API key and Pro subscription', 'yellow')
  await testEndpoint(
    'AI sparring conversation',
    '/api/v1/ai/sparring',
    {
      method: 'POST',
      body: JSON.stringify({
        message: 'สวัสดีครับ',
        conversation_history: []
      })
    }
  )

  // Summary
  log('\n╔════════════════════════════════════════╗', 'cyan')
  log('║  Test Suite Complete                   ║', 'cyan')
  log('╚════════════════════════════════════════╝', 'cyan')
  log('\nAll endpoints have been tested. Check results above.', 'cyan')
  log('Note: Some tests may fail if database is empty or OpenAI key is missing.\n', 'yellow')
}

// Run the tests
runTests().catch(error => {
  log(`\n✗ Test suite error: ${error.message}`, 'red')
  process.exit(1)
})
