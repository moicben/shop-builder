import puppeteer from 'puppeteer';

/**
 * Launches a Puppeteer browser instance.
 * @returns {Promise<object>} - The Puppeteer browser instance.
 */
export async function launchBrowser() {
    return puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1440, height: 900 },
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-client-side-phishing-detection',
            '--disable-default-apps',
            '--disable-features=site-per-process',
            '--disable-hang-monitor',
            '--disable-ipc-flooding-protection',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-renderer-backgrounding',
            '--disable-sync',
            '--disable-translate',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-first-run',
            '--safebrowsing-disable-auto-update',
            '--enable-automation',
            '--password-store=basic',
            '--use-mock-keychain',
        ],
    });
}

/**
 * Manages multiple browser instances and executes tasks in parallel.
 * @param {Array} tasks - An array of tasks to execute. Each task is a function that accepts a browser instance and a page.
 * @param {number} maxBrowsers - The maximum number of browsers to run simultaneously.
 * @param {number} [tabsPerBrowser=1] - The number of tabs (pages) each browser should open.
 * @returns {Promise<Array>} - The results of all tasks.
 */
export async function runWithMultipleBrowsers(tasks, maxBrowsers, tabsPerBrowser = 1) {
    const browsers = [];
    const results = [];
    const taskQueue = [...tasks]; // Copy tasks into a queue

    try {
        // Launch the specified number of browsers
        for (let i = 0; i < maxBrowsers; i++) {
            browsers.push(await launchBrowser());
        }

        // Function to execute tasks sequentially on a page
        const executeTasksOnPage = async (browser, page) => {
            while (taskQueue.length > 0) {
                const task = taskQueue.shift(); // Get the next task
                if (!task) break;

                try {
                    const result = await task(browser, page);
                    results.push(result);
                } catch (err) {
                    console.error(`Error executing a task:`, err);
                }
            }
        };

        // Execute tasks on all browsers with multiple tabs
        await Promise.all(
            browsers.map(async (browser) => {
                const pages = [];
                for (let i = 0; i < tabsPerBrowser; i++) {
                    pages.push(await browser.newPage());
                }

                // Run tasks on all pages of the browser
                await Promise.all(pages.map((page) => executeTasksOnPage(browser, page)));
            })
        );
    } finally {
        // Close all browsers
        for (const browser of browsers) {
            await browser.close();
        }
    }

    return results;
}