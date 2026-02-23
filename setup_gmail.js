#!/usr/bin/env node

/**
 * Gmail API Setup Script
 * Helps you authenticate with Gmail to read verification codes
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = path.join(__dirname, 'gmail-token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'gmail-credentials.json');

async function authorize() {
  let credentials;
  try {
    credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, 'utf8'));
  } catch (err) {
    console.error('Error loading credentials file:', err);
    console.log('\n=== SETUP INSTRUCTIONS ===');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Create a new project or select an existing one');
    console.log('3. Enable Gmail API');
    console.log('4. Create OAuth 2.0 credentials (Desktop app)');
    console.log('5. Download the credentials file');
    console.log(`6. Save it as: ${CREDENTIALS_PATH}`);
    console.log('7. Run this script again');
    return;
  }

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we already have a token
  try {
    const token = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    console.log('✓ Gmail authentication already configured!');
    return oAuth2Client;
  } catch (err) {
    return getNewToken(oAuth2Client);
  }
}

function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n=== Gmail Authorization ===');
  console.log('Authorize this app by visiting this URL:\n');
  console.log(authUrl);
  console.log('\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', async (code) => {
      rl.close();
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        
        // Store the token
        await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
        console.log('✓ Token stored to', TOKEN_PATH);
        console.log('✓ Gmail authentication complete!');
        resolve(oAuth2Client);
      } catch (err) {
        console.error('Error retrieving access token', err);
        reject(err);
      }
    });
  });
}

// Run setup
authorize()
  .then(() => {
    console.log('\n=== Next Steps ===');
    console.log('1. Set your VFS Global credentials:');
    console.log('   export VFS_EMAIL="your-email@example.com"');
    console.log('   export VFS_PASSWORD="your-password"');
    console.log('2. Run the checker:');
    console.log('   npm start');
  })
  .catch(console.error);
