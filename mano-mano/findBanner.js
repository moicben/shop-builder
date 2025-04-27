import fs from "fs";
import path from "path";

/**
 * Recherche dans categories.json la bannerUrl correspondant au hubLink donné.
 * @param {string} hubLink - L'URL du hub.
 * @returns {string|null} - La bannerUrl si trouvée, sinon null.
 */
export async function findBannerForHubLink(hubLink) {
    if (!hubLink) {
        return null;
    }
    const categoriesFilePath = path.join(process.cwd(), "mano-mano", "json", "categories.json");
    const categoriesData = JSON.parse(fs.readFileSync(categoriesFilePath, "utf8"));
    const lowerHubLink = hubLink.toLowerCase();
    
    // Recherche d'une correspondance exacte dans les enregistrements
    const record = categoriesData.find(cat =>
        cat.hubLink && cat.hubLink.toLowerCase() === lowerHubLink
    );
    
    return record ? record.bannerUrl : null;
}

/**
 * À partir d'une URL (produit ou hub), détermine le hubLink correspondant et retourne la bannerUrl associée.
 * Si l'URL contient déjà "/hub/", elle est utilisée directement, sinon on parcourt products.json pour la trouver.
 * @param {string} url - L'URL du produit ou du hub.
 * @returns {string|null} - La bannerUrl trouvée ou null.
 */
export async function findBanner(url) {
    if (!url) {
        return null;
    }
    let hubLink = null;
    const lowerUrl = url.toLowerCase();
    
    // Si l'URL fournie contient "/hub/", on la considère comme un hubLink.
    if (lowerUrl.includes("/hub/")) {
        hubLink = url;
    } else {
        // Sinon, on recherche dans products.json (le fichier contenant les enregistrements de hubs)
        const productsFilePath = path.join(process.cwd(), "mano-mano", "json", "products.json");
        const productsData = JSON.parse(fs.readFileSync(productsFilePath, "utf8"));
        // Parcourir chaque enregistrement pour vérifier si l'URL du produit y figure
        for (const record of productsData) {
            if (Array.isArray(record.products)) {
                const foundProduct = record.products.find(p =>
                    p.url && p.url.trim().toLowerCase() === lowerUrl
                );
                if (foundProduct) {
                    hubLink = record.hubLink;
                    break;
                }
            }
        }
    }
    return hubLink ? findBannerForHubLink(hubLink) : "https://cdn.manomano.com/media/category-hub/banner-hub-1.jpg";
}