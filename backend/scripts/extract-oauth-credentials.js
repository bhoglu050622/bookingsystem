#!/usr/bin/env node

/**
 * Helper script to extract Google OAuth credentials from JSON file
 * Usage: node scripts/extract-oauth-credentials.js <path-to-client-secret.json>
 */

const fs = require('fs');
const path = require('path');

const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('Usage: node scripts/extract-oauth-credentials.js <path-to-client-secret.json>');
  process.exit(1);
}

try {
  const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
  const credentials = JSON.parse(jsonContent);

  if (!credentials.web) {
    console.error('Error: JSON file should contain a "web" property with OAuth credentials');
    process.exit(1);
  }

  const clientId = credentials.web.client_id;
  const clientSecret = credentials.web.client_secret;

  if (!clientId || !clientSecret) {
    console.error('Error: Missing client_id or client_secret in JSON file');
    process.exit(1);
  }

  console.log('\n✅ OAuth Credentials Extracted:\n');
  console.log('Add these to your apps/backend/.env file:\n');
  console.log(`GOOGLE_OAUTH_CLIENT_ID=${clientId}`);
  console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${clientSecret}`);
  console.log('\n');

  // Also check for redirect URIs
  if (credentials.web.redirect_uris && credentials.web.redirect_uris.length > 0) {
    console.log('📋 Redirect URIs found in JSON:');
    credentials.web.redirect_uris.forEach((uri, index) => {
      console.log(`   ${index + 1}. ${uri}`);
    });
    console.log('\n');
    console.log('⚠️  Make sure this redirect URI is added in Google Cloud Console:');
    console.log('   http://localhost:3001/api/auth/google/callback\n');
  }

} catch (error) {
  console.error('Error reading JSON file:', error.message);
  process.exit(1);
}

