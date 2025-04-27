import fs from "fs";
import path from "path";
import { createContent } from "./createContent.js";
import { uploadShop } from "./uploadContent.js";
import { createProperty } from "./../utils/vercel/createProperty.js";
import { indexShop } from "../utils/google/indexShop.js";

async function main() {
    // Étape 1 : Génération des données via createContent.js
    console.log("Génération des données de shop...");
    const shopObjects = await createContent();
    console.log(`Données générées pour ${shopObjects.length} shop(s).`);
    
    // Étape 2 : Upload des shops et contenus avec uploadContent.js
    console.log("Démarrage de l'upload des shops et contenus...");
    // Ici, uploadShop doit mettre à jour chaque shopObject avec son id (par exemple shopData.id)
    await uploadShop(shopObjects);
    console.log("Upload terminé.");
    
    // Étape 3 : Créer la propriété Vercel uniquement pour les shops traités dans ce run
    // On itère directement sur shopObjects complétés, en supposant que uploadShop a ajouté shopData.id
    for (const shopObj of shopObjects) {
        const shop = shopObj.shopData;
        if (!shop.id) {
            console.warn(`Le shop '${shop.name}' n'a pas d'ID, on ne crée pas de propriété.`);
            continue;
        }
        try {
            console.log(`Création de la propriété Vercel pour le shop '${shop.name}'...`);
            const result = await createProperty(shop, "mano-store");
            console.log(`Propriété créée pour le shop '${shop.name}':`, result);
        } catch (err) {
            console.error(`Erreur lors de la création de la propriété pour le shop ${shop.id}:`, err);
        }
    }
    
    // Étape 4 : Indexer le(s) shop(s) avec Google Search Console via indexShop
    for (const shopObj of shopObjects) {
        const shop = shopObj.shopData;
        if (!shop.domain) {
            console.warn(`Le shop '${shop.name}' n'a pas de domaine, on ne lance pas l'indexation.`);
            continue;
        }
        try {
            console.log(`Indexation du shop '${shop.name}' (https://${shop.domain}) via Google Search Console...`);
            await indexShop(shop.domain);
            console.log(`Indexation terminée pour le shop '${shop.name}'.`);
        } catch (err) {
            console.error(`Erreur lors de l'indexation du shop ${shop.id}:`, err);
        }
    }
    
    // Étape 5 : Déplacer le(s) fichier(s) JSON traités dans le sous-répertoire /uploaded
    console.log("Déplacement des fichiers JSON traités dans le sous-répertoire /uploaded...");
    const productsDir = path.join(process.cwd(), "mano-mano", "json", "products");
    const uploadedDir = path.join(productsDir, "uploaded");
    // Crée le dossier /uploaded s'il n'existe pas
    if (!fs.existsSync(uploadedDir)) {
        fs.mkdirSync(uploadedDir);
    }
    // Pour chaque shopObject, déplacer le fichier correspondant
    for (const shopObj of shopObjects) {
        const fileName = shopObj.fileName;
        const sourcePath = path.join(productsDir, fileName);
        const destinationPath = path.join(uploadedDir, fileName);
        try {
            fs.renameSync(sourcePath, destinationPath);
            console.log(`Fichier ${fileName} déplacé avec succès.`);
        } catch (err) {
            console.error(`Erreur lors du déplacement du fichier ${fileName}:`, err);
        }
    }
}

main().catch((err) => {
    console.error("Erreur globale :", err);
    process.exit(1);
});