import fs from 'fs';
import path from 'path';
import { runWithMultipleBrowsers } from '../utils/multiBrowser.js';

/**
 * Extracts detailed product information from a product page.
 * @param {object} browser - The Puppeteer browser instance.
 * @param {string} url - The product URL.
 * @returns {Promise<object>} - Object containing detailed product information.
 */
async function extractProductDetails(browser, url) {
    const page = await browser.newPage();
    console.log(`Navigation vers le produit ${url}...`);
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
        window.scrollBy(0, 1600);

        return {
            features: getFeatures('ul.a_I_DU > li'),
            images: getImages('body > div.c91M7oc > div > div > div > div.PDnmYj > aside > button > img'),
            details: document.querySelector('.Ssfiu-.o2c_dC.yBr4ZN')?.innerHTML || null,
        };
    });

    await page.close();
    return productDetails;
}

async function run() {
    const productsFilePath = path.join(process.cwd(), 'mano-mano', 'json', 'products.json');
    const outputDir = path.join(process.cwd(), 'mano-mano', 'json', 'products');

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Load products.json
    const categories = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));

    const tasks = [];
    for (const category of categories) {
        const categoryFileName = `${category.categoryTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        const categoryFilePath = path.join(outputDir, categoryFileName);
        let categoryProducts = [];

        // Load existing category products if the file exists
        if (fs.existsSync(categoryFilePath)) {
            categoryProducts = JSON.parse(fs.readFileSync(categoryFilePath, 'utf8'));
        }

        for (const product of category.products) {
            if (categoryProducts.some(p => p.url === product.url)) {
                console.log(`Produit déjà extrait : ${product.url}. On passe.`);
                continue;
            }

            tasks.push(async (browser) => {
                try {
                    const { title, url, price, originalPrice } = product;
                    const productDetails = await extractProductDetails(browser, url);

                    categoryProducts.push({
                        title,
                        url,
                        price,
                        originalPrice,
                        ...productDetails,
                    });

                    console.log(`Produit extrait : ${url}`);

                    // Save the category file after each product extraction
                    fs.writeFileSync(categoryFilePath, JSON.stringify(categoryProducts, null, 2), 'utf8');
                    console.log(`Fichier mis à jour : ${categoryFileName}`);
                } catch (err) {
                    console.error(`Erreur lors de l'extraction du produit ${product.url} :`, err);
                }
            });
        }
    }

    // Run tasks with a configurable number of browsers
    const maxBrowsers = 5; // Adjust this value to control the number of simultaneous browsers
    await runWithMultipleBrowsers(tasks, maxBrowsers);

    console.log("Extraction des produits détaillés terminée.");
}

run().catch(err => {
    console.error("Erreur durant l'extraction des produits détaillés :", err);
});