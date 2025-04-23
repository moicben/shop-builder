import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

/**
 * Launches a Puppeteer browser instance.
 * @returns {Promise<object>} - The Puppeteer browser instance.
 */
async function launchBrowser() {
    return puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
        //executablePath: "/usr/bin/google-chrome-stable"
    });
}

/**
 * Manages multiple browser instances and executes tasks in parallel.
 * @param {Array} tasks - An array of tasks to execute. Each task is a function that accepts a browser instance.
 * @param {number} maxBrowsers - The maximum number of browsers to run simultaneously.
 */
async function runWithMultipleBrowsers(tasks, maxBrowsers) {
    const browsers = [];
    const results = [];
    const taskQueue = [...tasks]; // Copie des tâches dans une file d'attente

    try {
        // Lancer les navigateurs
        for (let i = 0; i < maxBrowsers; i++) {
            browsers.push(await launchBrowser());
        }

        // Fonction pour exécuter les tâches séquentiellement sur un navigateur
        const executeTasks = async (browser) => {
            while (taskQueue.length > 0) {
                const task = taskQueue.shift(); // Récupère la prochaine tâche
                if (!task) break;

                try {
                    //console.log(`Exécution d'une tâche avec un navigateur.`);
                    const result = await task(browser);
                    results.push(result);
                } catch (err) {
                    console.error(`Erreur lors de l'exécution d'une tâche :`, err);
                }
            }
        };

        // Exécuter les tâches sur tous les navigateurs
        await Promise.all(browsers.map(browser => executeTasks(browser)));
    } finally {
        // Fermer tous les navigateurs
        for (const browser of browsers) {
            await browser.close();
        }
    }

    return results;
}

/**
 * Extracts products from a given category URL using the selector "a.c8g1eWS".
 * @param {object} browser - The Puppeteer browser instance.
 * @param {string} url - The category URL.
 * @returns {Promise<Array>} - Array of extracted product objects.
 */
async function extractProductsFromCategory(browser, url) {
    const page = await browser.newPage();
    //console.log(`Navigation vers la catégorie ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the product selector to appear.
    await page.waitForSelector('a.c8g1eWS', { timeout: 10000 }).catch(() => {
        console.warn(`Sélecteur "a.c8g1eWS" non trouvé sur ${url}`);
    });

    const products = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a.c8g1eWS')).map(el => {
            const productTitle = el.getAttribute('title') || '';
            const productUrl = el.href;
            const imageElem = el.querySelector('img.ZlnC-h');
            const productImage = imageElem ? imageElem.src : '';
            const priceElem = el.querySelector('span[data-testid="price-main"] span[itemprop="price"]');
            const price = priceElem ? priceElem.textContent.trim() : '';
            const originalPriceElem = el.querySelector('span[data-testid="price-retail"] span[itemprop="price"]');
            const originalPrice = originalPriceElem ? originalPriceElem.textContent.trim() : '';
            let info = "";
            const infoElem = el.querySelector('span.b38yzx');
            if (infoElem) {
                info = infoElem.textContent.trim();
            }
            if (!info) {
                const manoExpressImg = el.querySelector('img[alt*="ManoExpress"]');
                if (manoExpressImg) {
                    info = "ManoExpress gratuit";
                }
            }
            return {
                title: productTitle,
                url: productUrl,
                image: productImage,
                price: price,
                originalPrice: originalPrice,
                info: info
            };
        });
    });

    await page.close();
    return products;
}

async function run() {
    const categoriesFilePath = path.join(process.cwd(), 'mano-mano', 'json', 'categories.json');
    const productsFilePath = path.join(process.cwd(), 'mano-mano', 'json', 'products.json');

    const categoriesData = JSON.parse(fs.readFileSync(categoriesFilePath, 'utf8'));

    let allProducts = [];
    if (fs.existsSync(productsFilePath)) {
        try {
            allProducts = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));
        } catch (err) {
            console.warn("Impossible de parser products.json. On repart sur une extraction vide.");
            allProducts = [];
        }
    }

    // Créer un ensemble des URLs de catégories déjà extraites
    const extractedCategoryUrls = new Set(allProducts.map(item => item.categoryUrl));

    const tasks = [];
    for (const hub of categoriesData) {
        for (const category of hub.categories) {
            if (extractedCategoryUrls.has(category.url)) {
                console.log(`Catégorie "${category.title}" déjà extraite. On passe.`);
                continue;
            }

            tasks.push(async (browser) => {
                try {
                    const products = await extractProductsFromCategory(browser, category.url);
                    allProducts.push({
                        hubTitle: hub.hubTitle,
                        hubLink: hub.hubLink,
                        categoryTitle: category.title,
                        categoryUrl: category.url,
                        products: products
                    });
                    console.log(`Extrait ${products.length} produit(s) de la catégorie "${category.title}"`);

                    // Mise à jour du fichier products.json après chaque extraction de catégorie
                    fs.writeFileSync(productsFilePath, JSON.stringify(allProducts, null, 2), 'utf8');

                    // Calculer et afficher la progression
                    const totalCategories = categoriesData.reduce((sum, hub) => sum + hub.categories.length, 0);
                    const completedCategories = allProducts.length;
                    const progress = Math.round((completedCategories / totalCategories) * 100);
                    const hubIndex = categoriesData.indexOf(hub) + 1;
                    const categoryIndex = hub.categories.indexOf(category) + 1;
                    console.log(`[${progress}%] Hub ${hubIndex}/${categoriesData.length}, Catégorie ${categoryIndex}/${hub.categories.length}`);
                } catch (err) {
                    console.error(`Erreur lors de l'extraction des produits de "${category.title}":`, err);
                }
            });
        }
    }

    // Run tasks with a configurable number of browsers
    const maxBrowsers = 5; // Change this value to control the number of simultaneous browsers
    await runWithMultipleBrowsers(tasks, maxBrowsers);

    console.log("Extraction des produits complète. Résultats sauvegardés dans", productsFilePath);
}

run().catch(err => {
    console.error("Erreur durant l'extraction des produits :", err);
});