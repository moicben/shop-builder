import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

/**
 * Extracts products from a given category URL using the selector "a.c8g1eWS".
 * @param {object} browser - The Puppeteer browser instance.
 * @param {string} url - The category URL.
 * @returns {Promise<Array>} - Array of extracted product objects.
 */
async function extractProductsFromCategory(browser, url) {
    const page = await browser.newPage();
    console.log(`Navigation vers la catégorie ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for the product selector to appear.
    await page.waitForSelector('a.c8g1eWS', { timeout: 10000 }).catch(() => {
        console.warn(`Sélecteur "a.c8g1eWS" non trouvé sur ${url}`);
    });
    
    const products = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a.c8g1eWS')).map(el => {
            // Extract title from the element's title attribute.
            const productTitle = el.getAttribute('title') || '';
            // Product URL.
            const productUrl = el.href;
            // Main image (target the image with class "ZlnC-h")
            const imageElem = el.querySelector('img.ZlnC-h');
            const productImage = imageElem ? imageElem.src : '';
            
            // Extract current price
            const priceElem = el.querySelector('span[data-testid="price-main"] span[itemprop="price"]');
            const price = priceElem ? priceElem.textContent.trim() : '';
            
            // Extract original price (price before reduction)
            const originalPriceElem = el.querySelector('span[data-testid="price-retail"] span[itemprop="price"]');
            const originalPrice = originalPriceElem ? originalPriceElem.textContent.trim() : '';
            
            // Extract additional info.
            // First try to get text from an element with class "delivery-info"
            let info = "";
            const infoElem = el.querySelector('span.b38yzx');
            if (infoElem) {
                info = infoElem.textContent.trim();
            }
            // If not available, check for an image with alt containing "ManoExpress"
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
    // Chemin vers le fichier categories.json et products.json
    const categoriesFilePath = path.join(process.cwd(), 'mano-mano', 'json', 'categories.json');
    const productsFilePath = path.join(process.cwd(), 'mano-mano', 'json', 'products.json');
    
    // Lecture du fichier des catégories
    const categoriesData = JSON.parse(fs.readFileSync(categoriesFilePath, 'utf8'));
    
    let allProducts = [];
    // Charger les produits déjà extraits, si le fichier existe
    if (fs.existsSync(productsFilePath)) {
        try {
            allProducts = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));
        } catch (err) {
            console.warn("Impossible de parser products.json. On repart sur une extraction vide.");
            allProducts = [];
        }
    }
    
    // Pour chaque hub et pour chaque catégorie, extraire les produits
    for (const hub of categoriesData) {
        for (const category of hub.categories) {
            // Vérifier si la catégorie a déjà été scrapée pour éviter le reprocessing
            const alreadyScraped = allProducts.find(item => 
                item.hubLink === hub.hubLink && item.categoryUrl === category.url
            );
            if (alreadyScraped) {
                console.log(`Catégorie "${category.title}" déjà scrapée. On passe.`);
                continue;
            }
            
            console.log(`${categoriesData.indexOf(hub) + 1} / ${categoriesData.length} -> ${hub.hubTitle} -> ${hub.categories.indexOf(category) + 1} / ${hub.categories.length} -> ${category.title}`); 
            
            // Ouvrir un nouveau navigateur pour cette catégorie
            const browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
            });
            
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
            } catch (err) {
                console.error(`Erreur lors de l'extraction des produits de "${category.title}":`, err);
            }
            
            await browser.close();
            
            // Mise à jour du fichier products.json après chaque extraction de catégorie
            fs.writeFileSync(productsFilePath, JSON.stringify(allProducts, null, 2), 'utf8');
            console.log(`Fichier products.json mis à jour.`);
        }
    }
    
    console.log("Extraction des produits complète. Résultats sauvegardés dans", productsFilePath);
}

run().catch(err => {
    console.error("Erreur durant l'extraction des produits :", err);
});