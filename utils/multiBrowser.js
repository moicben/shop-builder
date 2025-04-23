import puppeteer from 'puppeteer';

/**
 * Launches a Puppeteer browser instance.
 * @returns {Promise<object>} - The Puppeteer browser instance.
 */
export async function launchBrowser() {
    return puppeteer.launch({
        headless: false,
        defaultViewport: {width: 1440, height: 900},
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
 * @param {Array} tasks - An array of tasks to execute. Each task is a function that accepts a browser instance.
 * @param {number} maxBrowsers - The maximum number of browsers to run simultaneously.
 * @returns {Promise<Array>} - The results of all tasks.
 */
export async function runWithMultipleBrowsers(tasks, maxBrowsers) {
    const browsers = [];
    const results = [];
    const taskQueue = [...tasks]; // Copy tasks into a queue

    try {
        // Launch the specified number of browsers
        for (let i = 0; i < maxBrowsers; i++) {
            browsers.push(await launchBrowser());
        }

        // Function to execute tasks sequentially on a browser
        const executeTasks = async (browser) => {
            while (taskQueue.length > 0) {
                const task = taskQueue.shift(); // Get the next task
                if (!task) break;

                try {
                    const result = await task(browser);
                    results.push(result);
                } catch (err) {
                    console.error(`Error executing a task:`, err);
                }
            }
        };

        // Execute tasks on all browsers
        await Promise.all(browsers.map(browser => executeTasks(browser)));
    } finally {
        // Close all browsers
        for (const browser of browsers) {
            await browser.close();
        }
    }

    return results;
}