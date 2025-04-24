import puppeteer from 'puppeteer';

/**
 * Launches a Puppeteer browser instance.
 * @returns {Promise<object>} - The Puppeteer browser instance.
 */


// Proxy Configuration 
const proxyAddress = 'proxy.oculus-proxy.com';
const proxyPort = '31112';
const proxyPassword = 'sxjozu794g50';
const proxyUsername = 'oc-0b3b58f5de2c1506ce227d596c3517f6586af56e3fc513b2c187e07ba94b765e-country-FR-session-94752'



export async function launchBrowser() {
    return puppeteer.launch({
        headless: false, // Garder le mode non-headless
        defaultViewport: { width: 1440, height: 900 },
        executablePath: '/usr/bin/google-chrome-stable', // Chemin vers l'exécutable de Chrome
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
            `--proxy-server=${proxyAddress}:${proxyPort}`,
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
    const taskQueue = tasks.map((task) => ({ task, retries: 0 })); // Ajout des retries pour chaque tâche

    try {
        // Lancer les navigateurs
        for (let i = 0; i < maxBrowsers; i++) {
            browsers.push(await launchBrowser());
        }

        // Fonction pour exécuter les tâches sur une page
        const executeTasksOnPage = async (browser, page) => {
            while (taskQueue.length > 0) {
                const { task, retries } = taskQueue.shift(); // Récupérer la tâche et son compteur de retries
                if (!task) break;

                try {
                    const result = await task(browser, page); // Exécuter la tâche
                    results.push(result); // Ajouter le résultat
                } catch (err) {
                    console.error(`Error executing task (retry ${retries}):`, err);

                    if (retries < maxRetries) {
                        // Réinsérer la tâche dans la file d'attente avec un retry incrémenté
                        taskQueue.push({ task, retries: retries + 1 });
                    } else {
                        console.error(`Task failed after ${maxRetries} retries.`);
                    }
                }
            }
        };

        // Exécuter les tâches sur tous les navigateurs avec plusieurs onglets
        await Promise.all(
            browsers.map(async (browser) => {
                const pages = await browser.pages(); // Récupérer les pages existantes
                for (let i = 0; i < tabsPerBrowser; i++) {
                    const page = pages[i] || await browser.newPage(); // Utiliser une page existante ou en créer une nouvelle

                    // Authentification par proxy (si besoin)
                    await page.authenticate({
                        username: proxyUsername,
                        password: proxyPassword,
                    });

                    // Configurer un timeout personnalisé pour chaque page
                    page.setDefaultNavigationTimeout(60000); // Timeout de 60 secondes
                    pages.push(page);
                }

                // Exécuter les tâches sur toutes les pages du navigateur
                await Promise.all(pages.map((page) => executeTasksOnPage(browser, page)));
            })
        );
    } finally {
        // Fermer tous les navigateurs
        for (const browser of browsers) {
            await browser.close();
        }
    }

    return results;
}