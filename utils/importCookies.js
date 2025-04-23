import fs from 'fs';

/**
 * Imports cookies from a JSON file and sets them in the Puppeteer page.
 * @param {object} page - The Puppeteer page instance.
 * @param {string} cookieFilePath - The path to the JSON file containing cookies.
 * @returns {Promise<void>}
 */
export async function importCookies(page, cookieFilePath) {
    if (!fs.existsSync(cookieFilePath)) {
        console.warn(`Cookie file not found: ${cookieFilePath}`);
        return;
    }

    try {
        const cookies = JSON.parse(fs.readFileSync(cookieFilePath, 'utf8'));
        await page.setCookie(...cookies);
        //console.log(`Cookies imported from ${cookieFilePath}`);
    } catch (err) {
        console.error(`Error importing cookies from ${cookieFilePath}:`, err);
    }
}