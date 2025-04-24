import puppeteer from 'puppeteer';
import { chooseRandomProxy } from './randomProxy.js';
import proxies from '../mano-mano/isp_proxies.json' assert { type: 'json' };

/**
 * Lance une instance du navigateur Puppeteer avec un proxy aléatoire.
 * @returns {Promise<object>} - L'instance du navigateur.
 */
export async function launchBrowser() {

    // Sélectionne un proxy aléatoire	
    const proxy = chooseRandomProxy(proxies);

    // Lance le navigateur avec Puppeteer
    return puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1440, height: 900 },
        //executablePath: '/usr/bin/google-chrome-stable',
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
            `--proxy-server=${proxy.host}:${proxy.port}`,
        ],
    });
}

/**
 * Manages multiple browser instances and executes tasks in parallel with retries.
 * @param {Array} tasks - An array of tasks to execute. Each task is a function that accepts a browser instance and a page.
 * @param {number} maxBrowsers - The maximum number of browsers to run simultaneously.
 * @param {number} [tabsPerBrowser=1] - The number of tabs (pages) each browser should open.
 * @param {number} [maxRetries=3] - The maximum number of retries for a failed task.
 * @returns {Promise<Array>} - The results of all tasks.
 */
export async function runWithMultipleBrowsers(tasks, maxBrowsers, tabsPerBrowser = 1, maxRetries = 3) {
    const browsers = [];
    const results = [];
    const taskQueue = tasks.map((task) => ({ task, retries: 0 }));

    try {
        // Lancer les navigateurs
        for (let i = 0; i < maxBrowsers; i++) {
            browsers.push(await launchBrowser());
        }

        // Fonction pour exécuter les tâches sur une page
        const executeTasksOnPage = async (browser, page) => {
            while (taskQueue.length > 0) {
                const { task, retries } = taskQueue.shift();
                if (!task) break;
                try {
                    const result = await task(browser, page);
                    results.push(result);
                } catch (err) {
                    console.error(`Error executing task (retry ${retries}):`, err);
                    if (retries < maxRetries) {
                        taskQueue.push({ task, retries: retries + 1 });
                    } else {
                        console.error(`Task failed after ${maxRetries} retries.`);
                    }
                }
            }
        };

        // Exécution des tâches sur chaque navigateur et page, avec proxy aléatoire pour l'authentification
        await Promise.all(
            browsers.map(async (browser) => {
                let pages = await browser.pages();
                while (pages.length < tabsPerBrowser) {
                    pages.push(await browser.newPage());
                }
                for (const page of pages) {
                    const proxy = chooseRandomProxy(proxies);
                    await page.authenticate({
                        username: proxy.login,
                        password: proxy.password,
                    });
                    page.setDefaultNavigationTimeout(60000);
                }
                await Promise.all(pages.map((page) => executeTasksOnPage(browser, page)));
            })
        );
    } finally {
        for (const browser of browsers) {
            await browser.close();
        }
    }
    return results;
}