# VFS Global Visa Slot Checker

Automated tool to check visa appointment availability across all French visa offices in Australia for Short Stay Schengen visas.

## Features

- ✅ Automatic login to VFS Global portal
- ✅ Gmail integration for verification code retrieval
- ✅ Checks all visa office locations
- ✅ Filters for Short Stay Schengen visa
- ✅ Saves detailed results to JSON
- ✅ Clear console output with availability status

## Prerequisites

- Node.js (v14 or higher)
- Gmail account
- VFS Global account credentials

## Setup Instructions

### 1. Install Dependencies

```bash
cd visa-slot-checker
npm install
```

### 2. Configure Gmail API Access

**Step 1: Create a Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the **Gmail API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

**Step 2: Create OAuth Credentials**

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure consent screen if prompted
4. Application type: **Desktop app**
5. Download the credentials file
6. Save it as `gmail-credentials.json` in the visa-slot-checker folder

**Step 3: Authorize the App**

```bash
npm run setup
```

Follow the prompts:
- A URL will be displayed
- Open it in your browser
- Sign in with your Gmail account
- Authorize the application
- Copy the authorization code
- Paste it back into the terminal

### 3. Set Your VFS Credentials

```bash
export VFS_EMAIL="your-email@example.com"
export VFS_PASSWORD="your-password"
```

Or create a `.env` file:

```bash
echo 'VFS_EMAIL=your-email@example.com' > .env
echo 'VFS_PASSWORD=your-password' >> .env
```

Then load it before running:

```bash
source .env
```

## Usage

### Run the Checker

```bash
npm start
```

The script will:
1. Login to VFS Global
2. Fetch verification code from your Gmail
3. Check each visa office location
4. Display availability in real-time
5. Save results to `slot-results.json`

### Sample Output

```
=== VFS Global Visa Slot Checker ===

Navigating to login page...
Entering credentials...
Waiting for verification code email...
✓ Verification code found: ABC123
Entering verification code...
✓ Login successful
Fetching visa office locations...
✓ Found 8 visa offices

Checking: Sydney...
✓ Sydney: SLOTS AVAILABLE (3 slots)
  Dates: 15 Jan 2024, 17 Jan 2024, 22 Jan 2024

Checking: Melbourne...
✗ Melbourne: No slots available

Checking: Brisbane...
✗ Brisbane: No slots available

...

=== SUMMARY ===
Total offices: 8
Available: 1
Unavailable: 7
Errors: 0

✓ Results saved to slot-results.json
```

### Results File

Results are saved to `slot-results.json`:

```json
{
  "timestamp": "2024-01-10T12:34:56.789Z",
  "results": [
    {
      "office": "Sydney",
      "status": "available",
      "available": true,
      "count": 3,
      "dates": ["15 Jan 2024", "17 Jan 2024", "22 Jan 2024"]
    },
    {
      "office": "Melbourne",
      "status": "unavailable",
      "available": false
    }
  ],
  "summary": {
    "total": 8,
    "available": 1,
    "unavailable": 7,
    "errors": 0
  }
}
```

## Scheduling Regular Checks

### Using Cron (Linux/Mac)

Check every hour:

```bash
0 * * * * cd /path/to/visa-slot-checker && /usr/bin/node visa_checker.js >> logs/checker.log 2>&1
```

Check every 15 minutes during business hours:

```bash
*/15 9-17 * * * cd /path/to/visa-slot-checker && /usr/bin/node visa_checker.js >> logs/checker.log 2>&1
```

### Using Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., every hour)
4. Action: Start a program
5. Program: `node.exe`
6. Arguments: `visa_checker.js`
7. Start in: `C:\path\to\visa-slot-checker`

## Troubleshooting

### "Could not retrieve verification code from Gmail"

- Check that Gmail API is enabled
- Verify `gmail-credentials.json` is correct
- Ensure the app is authorized (run `npm run setup` again)
- Check your Gmail inbox for the verification email manually

### "Login failed" or timeout errors

- Verify VFS_EMAIL and VFS_PASSWORD are correct
- Check if the VFS website structure has changed
- Try running in non-headless mode (set `headless: false` in code)

### No slots showing when you can see them manually

- The website structure may have changed
- Check the browser window when running
- Update the selectors in the code

## Customization

### Change Visa Type

Edit `CONFIG.visaType` in `visa_checker.js`:

```javascript
const CONFIG = {
  visaType: 'Long stay visa', // or any other type
  // ...
};
```

### Run in Background (Headless)

Edit `visa_checker.js`:

```javascript
this.browser = await puppeteer.launch({
  headless: true, // Change to true
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
```

### Add Notifications

Install a notification library:

```bash
npm install node-notifier
```

Add to the code when slots are found:

```javascript
const notifier = require('node-notifier');

if (result.status === 'available') {
  notifier.notify({
    title: 'Visa Slots Available!',
    message: `${office.text} has ${result.count} slots`,
  });
}
```

## Security Notes

- Never commit `gmail-credentials.json` or `gmail-token.json` to version control
- Keep your VFS credentials secure
- Use environment variables for sensitive data
- The `.gitignore` file is configured to exclude sensitive files

## License

MIT

## Disclaimer

This tool is for personal use only. Always verify availability on the official VFS Global website before making any decisions. The author is not responsible for any missed appointments or incorrect information.
