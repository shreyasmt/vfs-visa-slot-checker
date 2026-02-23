#!/usr/bin/env node

/**
 * VFS Global Visa Slot Checker - Manual Code Entry Version
 * No Gmail API required - you enter the verification code manually
 */

const puppeteer = require('puppeteer');
const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  loginUrl: 'https://visa.vfsglobal.com/aus/en/fra/login',
  visaType: 'Short stay Schengen visa',
  resultsFile: path.join(__dirname, 'slot-results.json'),
  timeout: 30000,
};

class VisaSlotChecker {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  /**
   * Prompt user for verification code
   */
  async getVerificationCodeManually() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      console.log('\n⏳ Waiting for verification code email...');
      console.log('📧 Check your email for the VFS Global verification code\n');
      
      rl.question('Enter the verification code: ', (code) => {
        rl.close();
        resolve(code.trim());
      });
    });
  }

  /**
   * Initialize browser and page
   */
  async initBrowser() {
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for production
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });
  }

  /**
   * Login to VFS Global portal
   */
  async login(email, password) {
    console.log('Navigating to login page...');
    await this.page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle2' });

    console.log('Entering credentials...');
    await this.page.type('input[name="email"]', email);
    await this.page.type('input[name="password"]', password);
    await this.page.click('button[type="submit"]');

    // Wait for verification code page
    await this.sleep(3000);

    // Get verification code from user
    const code = await this.getVerificationCodeManually();

    // Enter verification code
    console.log('Entering verification code...');
    await this.page.waitForSelector('input[name="code"]', { timeout: CONFIG.timeout });
    await this.page.type('input[name="code"]', code);
    await this.page.click('button[type="submit"]');

    // Wait for dashboard
    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✓ Login successful');
  }

  /**
   * Get all visa office locations from dropdown
   */
  async getVisaOffices() {
    console.log('Fetching visa office locations...');
    
    // Navigate to booking page
    await this.page.goto('https://visa.vfsglobal.com/aus/en/fra/book-an-appointment', {
      waitUntil: 'networkidle2',
    });

    // Wait for location dropdown
    await this.page.waitForSelector('select[name="location"]', { timeout: CONFIG.timeout });

    // Extract all office options
    const offices = await this.page.evaluate(() => {
      const select = document.querySelector('select[name="location"]');
      return Array.from(select.options)
        .filter(opt => opt.value)
        .map(opt => ({
          value: opt.value,
          text: opt.textContent.trim(),
        }));
    });

    console.log(`✓ Found ${offices.length} visa offices`);
    return offices;
  }

  /**
   * Check slot availability for a specific office
   */
  async checkOfficeSlots(office) {
    console.log(`\nChecking: ${office.text}...`);

    try {
      // Select the office
      await this.page.select('select[name="location"]', office.value);
      await this.sleep(2000);

      // Select visa type
      await this.page.waitForSelector('select[name="visa_type"]', { timeout: CONFIG.timeout });
      
      const visaTypeFound = await this.page.evaluate((visaType) => {
        const select = document.querySelector('select[name="visa_type"]');
        const option = Array.from(select.options).find(opt => 
          opt.textContent.trim().toLowerCase().includes(visaType.toLowerCase())
        );
        if (option) {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, CONFIG.visaType);

      if (!visaTypeFound) {
        return {
          office: office.text,
          status: 'error',
          message: 'Visa type not found',
        };
      }

      await this.sleep(2000);

      // Check for available slots
      const availability = await this.page.evaluate(() => {
        const slots = document.querySelectorAll('.available-slot, .slot-available');
        const noSlotsMsg = document.querySelector('.no-slots, .not-available');
        
        if (slots.length > 0) {
          return {
            available: true,
            count: slots.length,
            dates: Array.from(slots).map(slot => slot.textContent.trim()).slice(0, 5),
          };
        } else if (noSlotsMsg) {
          return { available: false };
        }
        
        return { available: false, uncertain: true };
      });

      return {
        office: office.text,
        status: availability.available ? 'available' : 'unavailable',
        ...availability,
      };
    } catch (error) {
      return {
        office: office.text,
        status: 'error',
        message: error.message,
      };
    }
  }

  /**
   * Check all offices
   */
  async checkAllOffices() {
    const offices = await this.getVisaOffices();
    const results = [];

    for (const office of offices) {
      const result = await this.checkOfficeSlots(office);
      results.push(result);
      
      // Display result
      if (result.status === 'available') {
        console.log(`✓ ${office.text}: SLOTS AVAILABLE (${result.count} slots)`);
        if (result.dates) {
          console.log(`  Dates: ${result.dates.join(', ')}`);
        }
      } else if (result.status === 'unavailable') {
        console.log(`✗ ${office.text}: No slots available`);
      } else {
        console.log(`⚠ ${office.text}: ${result.message}`);
      }
    }

    return results;
  }

  /**
   * Save results to file
   */
  async saveResults(results) {
    const output = {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: results.length,
        available: results.filter(r => r.status === 'available').length,
        unavailable: results.filter(r => r.status === 'unavailable').length,
        errors: results.filter(r => r.status === 'error').length,
      },
    };

    await fs.writeFile(CONFIG.resultsFile, JSON.stringify(output, null, 2));
    console.log(`\n✓ Results saved to ${CONFIG.resultsFile}`);
    return output;
  }

  /**
   * Run the complete check
   */
  async run(email, password) {
    try {
      console.log('=== VFS Global Visa Slot Checker (Manual Code Entry) ===\n');
      
      await this.initBrowser();
      await this.login(email, password);
      
      const results = await this.checkAllOffices();
      const output = await this.saveResults(results);

      console.log('\n=== SUMMARY ===');
      console.log(`Total offices: ${output.summary.total}`);
      console.log(`Available: ${output.summary.available}`);
      console.log(`Unavailable: ${output.summary.unavailable}`);
      console.log(`Errors: ${output.summary.errors}`);

      return output;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
if (require.main === module) {
  const email = process.env.VFS_EMAIL;
  const password = process.env.VFS_PASSWORD;

  if (!email || !password) {
    console.error('Please set VFS_EMAIL and VFS_PASSWORD environment variables');
    process.exit(1);
  }

  const checker = new VisaSlotChecker();
  checker.run(email, password)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = VisaSlotChecker;
