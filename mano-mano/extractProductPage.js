import fs from 'fs';
import path from 'path';
import { runWithMultipleBrowsers } from '../utils/multiBrowser.js';
import { importCookies } from '../utils/importCookies.js';

/**
 * Extracts detailed product information from a product page.
 * @param {object} page - The Puppeteer page instance (créée et configurée dans multiBrowser.js).
 * @param {string} url - The product URL.
 * @param {string} cookieFilePath - The path to the JSON file containing cookies.
 * @returns {Promise<object>} - Object containing detailed product information.
 */
async function extractProductDetails(page, url, cookieFilePath) {
    // Import cookies if a cookie file is provided
    if (cookieFilePath) {
        await importCookies(page, cookieFilePath);
    }

    await page.goto(url, { waitUntil: 'networkidle2' });

    const productDetails = await page.evaluate(async () => {
        const getImages = (selector) => Array.from(document.querySelectorAll(selector)).map(img => img.src);
        const getFeatures = (selector) => Array.from(document.querySelectorAll(selector)).map(el => el.textContent.trim());

        // Click the button to display all images
        const showAllImagesButton = document.querySelector("button.O08fxl.pChptO.A24Kw7.j83JLV");
        if (showAllImagesButton) {
            showAllImagesButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for images to load
        }

        // Scroll to load content
        window.scrollBy(0, 2400);

        // Attempt to get the details content immediately
        let details = document.querySelector('.Ssfiu-.o2c_dC.yBr4ZN')?.innerHTML || null;

        // If details is not found, wait and try again
        if (!details) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            details = document.querySelector('.Ssfiu-.o2c_dC.yBr4ZN')?.innerHTML || null;
            if (!details) {
                console.log("Details still not found.");
            }
        }

        // Get images from the primary selector
        let images = getImages('body > div.c91M7oc > div > div > div > div.PDnmYj > aside > button > img');
        if (images.length === 0) {
            images = [document.querySelector('.c9uNnvv.lBCr9G > img')?.src].filter(Boolean);
        }

        return {
            features: getFeatures('ul.a_I_DU > li'),
            images: images,
            details: details,
        };
    });

    return productDetails;
}

async function run() {
    const productsFilePath = path.join(process.cwd(), 'mano-mano', 'json', 'products.json');
    const outputDir = path.join(process.cwd(), 'mano-mano', 'json', 'products');
    const cookieFilePath = path.join(process.cwd(), 'mano-mano', 'cookies.json');

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Load products.json
    const categories = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));

    const tasks = [];
    let totalProducts = 0;
    let completedProducts = 0;

    for (const category of categories) {
        const categoryFileName = `${category.categoryTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        const categoryFilePath = path.join(outputDir, categoryFileName);
        let categoryProducts = [];

        // Load existing category products if the file exists
        if (fs.existsSync(categoryFilePath)) {
            categoryProducts = JSON.parse(fs.readFileSync(categoryFilePath, 'utf8'));
        }

        // Create a set of already scrapped URLs
        const scrappedUrls = new Set(categoryProducts.map(p => p.url));

        for (const product of category.products) {
            if (scrappedUrls.has(product.url)) {
                continue; // Skip already scrapped products
            }

            totalProducts++;
            // Notez que la tâche reçoit ici (browser, page) via multiBrowser.js,
            // ce qui nous permet de déléguer la création/configuration de la page.
            tasks.push(async (browser, page) => {
                try {
                    const { title, url, price, originalPrice } = product;
                    const productDetails = await extractProductDetails(page, url, cookieFilePath);

                    categoryProducts.push({
                        title,
                        url,
                        price,
                        originalPrice,
                        ...productDetails,
                    });

                    // Save the category file after each product extraction
                    fs.writeFileSync(categoryFilePath, JSON.stringify(categoryProducts, null, 2), 'utf8');

                    // Update progress
                    completedProducts++;
                    const progress = Math.round((completedProducts / totalProducts) * 100);
                    console.log(`[${progress}%] Extracted ${completedProducts}/${totalProducts} products.`);
                } catch (err) {
                    console.error(`Error extracting product ${product.url}:`, err);
                }
            });
        }
    }

    // Run tasks with a configurable number of browsers
    const maxBrowsers = 3;
    const tabsPerBrowser = 8;
    await runWithMultipleBrowsers(tasks, maxBrowsers, tabsPerBrowser);

    console.log("Product extraction complete.");
}

run().catch(err => {
    console.error("Error during product extraction:", err);
});