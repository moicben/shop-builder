import fs from 'fs';
import path from 'path';
import { runWithMultipleBrowsers } from '../utils/multiBrowser.js';
import { importCookies } from '../utils/importCookies.js';

/**
 * Extracts detailed product information from a product page.
 * @param {object} browser - The Puppeteer browser instance.
 * @param {string} url - The product URL.
 * @param {string} cookieFilePath - The path to the JSON file containing cookies.
 * @returns {Promise<object>} - Object containing detailed product information.
 */
async function extractProductDetails(browser, url, cookieFilePath) {
    const page = await browser.newPage();

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

        // If details is not found, wait 4 seconds and try again
        if (!details) {
            await new Promise(resolve => setTimeout(resolve, 4000));
            details = document.querySelector('.Ssfiu-.o2c_dC.yBr4ZN')?.innerHTML || null;
        }

        // Get images from the primary selector
        let images = getImages('body > div.c91M7oc > div > div > div > div.PDnmYj > aside > button > img');

        // If no images are found, use the fallback selector
        if (images.length === 0) {
            images = [document.querySelector('.c9uNnvv.lBCr9G > img')?.src].filter(Boolean);
        }

        return {
            features: getFeatures('ul.a_I_DU > li'),
            images: images,
            details: details,
        };
    });

    await page.close();
    return productDetails;
}

async function run() {
    const productsFilePath = path.join(process.cwd(), 'mano-mano', 'json', 'products.json');
    const outputDir = path.join(process.cwd(), 'mano-mano', 'json', 'products');
    const cookieFilePath = path.join(process.cwd(), 'mano-mano', 'cookies.json'); // Path to your cookie file

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
            tasks.push(async (browser) => {
                try {
                    const { title, url, price, originalPrice } = product;
                    const productDetails = await extractProductDetails(browser, url, cookieFilePath);

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
    const maxBrowsers = 6; // Adjust this value to control the number of simultaneous browsers
    await runWithMultipleBrowsers(tasks, maxBrowsers);

    console.log("Product extraction complete.");
}

run().catch(err => {
    console.error("Error during product extraction:", err);
});