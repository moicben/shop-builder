import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

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
        
      // Function to extract images from the page
        const getImages = (selector) => {
            return Array.from(document.querySelectorAll(selector)).map(img => img.src);
        };

      // Function to extract features from the page
        const getFeatures = (selector) => {
            return Array.from(document.querySelectorAll(selector)).map(el => el.textContent.trim());
        };

        // Click the button to display all images
        const showAllImagesButton = document.querySelector("button.O08fxl.pChptO.A24Kw7.j83JLV");
        if (showAllImagesButton) {
            showAllImagesButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for images to load
        }


        // Scroller de 800px pour charger le contenu
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

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    });

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

            try {
                // Preserve existing values from products.json
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
            } catch (err) {
                console.error(`Erreur lors de l'extraction du produit ${product.url} :`, err);
            }

            // Save the category file after each product extraction
            fs.writeFileSync(categoryFilePath, JSON.stringify(categoryProducts, null, 2), 'utf8');
            console.log(`Fichier mis à jour : ${categoryFileName}`);
        }
    }

    await browser.close();
    console.log("Extraction des produits détaillés terminée.");
}

run().catch(err => {
    console.error("Erreur durant l'extraction des produits détaillés :", err);
});