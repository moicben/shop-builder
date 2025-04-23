import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function extractCategoryData(browser, url) {
    const page = await browser.newPage();
    console.log(`Navigation vers ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extraction sur la page du hub.
    const result = await page.evaluate(() => {
        const extractData = (selector) => {
            return Array.from(document.querySelectorAll(selector))
                        .map(el => ({
                            url: el.href,
                            title: el.textContent.trim()
                        }));
        };
        const dataKsQsev = extractData('a.KsQsev');
        const dataUVtb8l = extractData('.uVtb8l > a');
        const combined = [...dataKsQsev, ...dataUVtb8l];
        const categories = Array.from(new Map(combined.map(item => [item.url, item])).values());
        
        const hubPageTitle = document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : "";
        const hubPageDescription = document.querySelector('.c7R5cAQ > p') ? document.querySelector('.c7R5cAQ > p').textContent.trim() : "";
        const hubBannerUrl = document.querySelector('img.iqns31') ? document.querySelector('img.iqns31').src : "";
        
        return { categories, hubPageTitle, hubPageDescription, hubBannerUrl };
    });
    
    await page.close();
    return result;
}

async function run() {
    // Lire les fichiers hubs.json et categories.json (s'il existe)
    const hubsFilePath = path.join(process.cwd(), 'mano-mano', 'json', 'hubs.json');
    const outputFilePath = path.join(process.cwd(), 'mano-mano', 'json', 'categories.json');
    const hubsData = JSON.parse(fs.readFileSync(hubsFilePath, 'utf8'));
  
    if (!hubsData || hubsData.length === 0) {
        console.error("Aucun hub trouvé dans hubs.json");
        process.exit(1);
    }

    let allCategories = [];
    if (fs.existsSync(outputFilePath)) {
        try {
            allCategories = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
        } catch (err) {
            console.warn("Impossible de parser categories.json. On repart sur une extraction vide.");
            allCategories = [];
        }
    }
    
    // Créer un ensemble de hubLinks déjà traités pour éviter le reprocessement
    const processedHubLinks = new Set(allCategories.map(item => item.hubLink));
  
    // Pour chaque hub, lancer une extraction si non déjà traitée
    for (const hub of hubsData) {
        console.log(`${hubsData.indexOf(hub) + 1} / ${hubsData.length} -> ${hub.title}`);
        
        if (processedHubLinks.has(hub.link)) {
            console.log(`Hub "${hub.title}" déjà scrapé, on passe.`);
            continue;
        }
        
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
        });
  
        const extractedData = await extractCategoryData(browser, hub.link);
        await browser.close();
  
        const hubData = {
            hubTitle: hub.title,
            hubLink: hub.link,
            pageTitle: extractedData.hubPageTitle,
            pageDescription: extractedData.hubPageDescription,
            bannerUrl: extractedData.hubBannerUrl,
            categories: extractedData.categories
        };
        allCategories.push(hubData);
        processedHubLinks.add(hub.link);
      
        // Mettre à jour le fichier categories.json après chaque extraction
        fs.writeFileSync(outputFilePath, JSON.stringify(allCategories, null, 2), 'utf8');
        console.log(`Extraction terminée pour "${hub.title}". Fichier mis à jour.`);
    }
    
    console.log("Extraction complète. Résultats sauvegardés dans", outputFilePath);
}

run().catch(err => {
    console.error("Erreur durant l'extraction :", err);
});