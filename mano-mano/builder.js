import fs from "fs";
import path from "path";
import { createContent } from "./createContent.js";
import { uploadShop } from "./uploadContent.js";
import { createProperty } from "./../utils/vercel/createProperty.js";
import { indexSite } from "../utils/google/indexSite.js";

async function main() {
    console.log("--- Lancement du builder Mano Mano ---");

    // Étape 1 : Génération des données via createContent.js
    console.log("-> [1/5] Rédaction des contenus <-");
    const shopObjects = await createContent();

    // Étape 2 : Upload des shops et contenus avec uploadContent.js
    console.log("-> [2/5] Upload des shops sur Supabase <-");
    await uploadShop(shopObjects);

    // Étape 3 : Créer la propriété Vercel pour les shops traités
    console.log("-> [3/5] Déploiement des propriétés Vercel <-");
    for (let i = 0; i < shopObjects.length; i++) {
        const shopObj = shopObjects[i];
        const shop = shopObj.shopData;
        if (!shop.id) {
            console.warn(`Le shop '${shop.name}' n'a pas d'ID, on ne crée pas de propriété.`);
            continue;
        }
        try {
            const result = await createProperty(shop, "mano-store");
            console.log(`${i + 1}/${shopObjects.length} deployée.`);
        } catch (err) {
            console.error(`Erreur lors de la création de la propriété pour le shop ${shop.id}:`, err);
        }
    }

    // Étape 4 : Indexer les shops avec Google Search Console via indexSite
    console.log("-> [4/5] Indexation Search Console des shops <-");
    for (let i = 0; i < shopObjects.length; i++) {
        const shopObj = shopObjects[i];
        const shop = shopObj.shopData;
        if (!shop.domain) {
            console.warn(`Le shop '${shop.name}' n'a pas de domaine, indexation annulée.`);
            continue;
        }
        try {
            // console.log(`Indexation du shop '${shop.name}' (https://${shop.domain})...`);
            await indexSite(shop.domain);
            console.log(`${i + 1}/${shopObjects.length} indexé.`);
        } catch (err) {
            console.error(`Erreur lors de l'indexation du shop ${shop.id}:`, err);
        }
    }

    // Étape 5 : Déplacer les fichiers JSON traités dans le sous-répertoire /uploaded
    console.log("-> [5/5] Déplacement des fichiers JSON traités <-");
    const productsDir = path.join(process.cwd(), "mano-mano", "json", "products");
    const uploadedDir = path.join(productsDir, "uploaded");
    if (!fs.existsSync(uploadedDir)) {
        fs.mkdirSync(uploadedDir);
    }
    for (let i = 0; i < shopObjects.length; i++) {
        const shopObj = shopObjects[i];
        const fileName = shopObj.fileName;
        const sourcePath = path.join(productsDir, fileName);
        const destinationPath = path.join(uploadedDir, fileName);
        try {
            fs.renameSync(sourcePath, destinationPath);
            console.log(`${i + 1}/${shopObjects.length} fichier '${fileName}' déplacé.`);
        } catch (err) {
            console.error(`Erreur lors du déplacement du fichier ${fileName}:`, err);
        }
    }
}

main().catch((err) => {
    console.error("Erreur globale :", err);
    process.exit(1);
});