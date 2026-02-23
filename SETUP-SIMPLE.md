# Simple Setup Guide - Manual Code Entry

This version doesn't require any Gmail API setup! You just enter the verification code yourself.

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shreyasmt/vfs-visa-slot-checker.git
   cd vfs-visa-slot-checker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Usage

1. **Set your VFS credentials:**
   ```bash
   export VFS_EMAIL="your-email@example.com"
   export VFS_PASSWORD="your-password"
   ```

   **Or on Windows:**
   ```cmd
   set VFS_EMAIL=your-email@example.com
   set VFS_PASSWORD=your-password
   ```

2. **Run the checker:**
   ```bash
   npm run start:manual
   ```

3. **When prompted:**
   - The script will open a browser and attempt to log in
   - VFS will send a verification code to your email
   - Check your email
   - Enter the code when the script asks for it
   - The script will then check all visa offices automatically

## Example Run

```
=== VFS Global Visa Slot Checker (Manual Code Entry) ===

Navigating to login page...
Entering credentials...

⏳ Waiting for verification code email...
📧 Check your email for the VFS Global verification code

Enter the verification code: 123456
Entering verification code...
✓ Login successful
Fetching visa office locations...
✓ Found 8 visa offices

Checking: Sydney...
✓ Sydney: SLOTS AVAILABLE (3 slots)
  Dates: 15 Jan 2024, 17 Jan 2024, 22 Jan 2024

Checking: Melbourne...
✗ Melbourne: No slots available

...

=== SUMMARY ===
Total offices: 8
Available: 1
Unavailable: 7
Errors: 0
```

## Scheduling Automatic Checks

### Linux/Mac (Cron)

Edit your crontab:
```bash
crontab -e
```

Add this line to check every hour:
```
0 * * * * cd /path/to/vfs-visa-slot-checker && export VFS_EMAIL="your@email.com" && export VFS_PASSWORD="yourpass" && npm run start:manual >> logs/checker.log 2>&1
```

**Note:** For scheduled runs, you'll want the fully automated version with Gmail API or IMAP. The manual version is best for on-demand checks.

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., every hour)
4. Action: Start a program
   - Program: `cmd.exe`
   - Arguments: `/c "set VFS_EMAIL=your@email.com && set VFS_PASSWORD=yourpass && cd C:\path\to\vfs-visa-slot-checker && npm run start:manual"`

## Tips

- Keep the browser window visible so you can see what's happening
- If you get stuck at any step, just restart the script
- Results are saved to `slot-results.json` after each run
- You can run this as many times as you want

## That's It!

No complex OAuth setup, no Google Cloud Console - just run it and enter the code when asked. Perfect for occasional manual checks.
