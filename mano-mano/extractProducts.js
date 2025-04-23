import fs from 'fs';
import path from 'path';
import { runWithMultipleBrowsers } from '../utils/multiBrowser.js';

/**
 * Extracts products from a given category URL using the selector "a.c8g1eWS".
 * @param {object} browser - The Puppeteer browser instance.
 * @param {string} url - The category URL.
 * @returns {Promise<Array>} - Array of extracted product objects.
 */
async function extractProductsFromCategory(browser, url) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the product selector to appear
    await page.waitForSelector('a.c8g1eWS', { timeout: 10000 }).catch(() => {
        console.warn(`Selector "a.c8g1eWS" not found on ${url}`);
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
            console.warn("Unable to parse products.json. Starting with an empty extraction.");
            allProducts = [];
        }
    }

    // Create a set of already extracted category URLs
    const extractedCategoryUrls = new Set(allProducts.map(item => item.categoryUrl));

    const tasks = [];
    for (const hub of categoriesData) {
        for (const category of hub.categories) {
            if (extractedCategoryUrls.has(category.url)) {
                console.log(`Category "${category.title}" already extracted. Skipping.`);
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
                    console.log(`Extracted ${products.length} product(s) from category "${category.title}"`);

                    // Update products.json after each category extraction
                    fs.writeFileSync(productsFilePath, JSON.stringify(allProducts, null, 2), 'utf8');

                    // Calculate and display progress
                    const totalCategories = categoriesData.reduce((sum, hub) => sum + hub.categories.length, 0);
                    const completedCategories = allProducts.length;
                    const progress = Math.round((completedCategories / totalCategories) * 100);
                    const hubIndex = categoriesData.indexOf(hub) + 1;
                    const categoryIndex = hub.categories.indexOf(category) + 1;
                    console.log(`[${progress}%] Hub ${hubIndex}/${categoriesData.length}, Category ${categoryIndex}/${hub.categories.length}`);
                } catch (err) {
                    console.error(`Error extracting products from "${category.title}":`, err);
                }
            });
        }
    }

    // Run tasks with a configurable number of browsers
    const maxBrowsers = 10; // Adjust this value to control the number of simultaneous browsers
    await runWithMultipleBrowsers(tasks, maxBrowsers);

    console.log("Product extraction complete. Results saved in", productsFilePath);
}

run().catch(err => {
    console.error("Error during product extraction:", err);
});