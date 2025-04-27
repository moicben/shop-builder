import fs from "fs";
import path from "path";
import { createContent } from "./createContent.js";
import { uploadShop } from "./uploadContent.js";
import { createProperty } from "./../utils/vercel/createProperty.js";
import { indexSite } from "../utils/google/indexSite.js";

// Définition du répertoire contenant les fichiers produits
const productsDir = path.join(process.cwd(), "mano-mano", "json", "products");

async function main() {
    console.log("--- Lancement du builder Mano Mano ---");
    
    // Étape 0 : Récupération de la liste des fichiers
    const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.json'));
    console.log(`Nombre de fichiers à traiter: ${files.length}`);

    // Boucle générale : pour chaque fichier traité, on exécute toutes les étapes
    for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        console.log(`\n=== Traitement du fichier ${fileName} (${i + 1}/${files.length}) ===`);

        // Étape 1 : Génération du contenu pour le fichier
        console.log("-> [1/5] Création du contenu");
        const shopObj = await createContent(fileName);

        // Étape 2 : Upload du shop et contenus
        console.log("-> [2/5] Upload sur Supabase");
        // On passe un tableau contenant uniquement shopObj à uploadShop
        await uploadShop([shopObj]);

        // Étape 3 : Création de la propriété Vercel
        const shop = shopObj.shopData;
        if (!shop.id) {
            console.warn(`-> [3/5] Le shop '${shop.name}' n'a pas d'ID, création de propriété ignorée.`);
        } else {
            console.log("-> [3/5] Déploiement sur Vercel");
            try {
                await createProperty(shop, "mano-store");
                //console.log(`[3/5] Propriété déployée pour '${shop.name}'.`);
            } catch (err) {
                console.error(`[3/5] Erreur de création de propriété pour '${shop.name}':`, err);
            }
        }

        // Étape 4 : Indexation via Google Search Console
        if (!shop.domain) {
            console.warn(`-> [4/5] Le shop '${shop.name}' n'a pas de domaine, indexation annulée.`);
        } else {
            console.log("-> [4/5] Indexation du shop");
            try {
                await indexSite(shop.domain);
                //console.log(`[4/5] Shop indexé: ${shop.domain}`);
            } catch (err) {
                console.error(`[4/5] Erreur lors de l'indexation du shop '${shop.name}':`, err);
            }
        }

        // Étape 5 : Déplacement du fichier JSON traité dans le sous-répertoire /uploaded
        console.log("-> [5/5] Déplacement du fichier JSON");
        const uploadedDir = path.join(productsDir, "uploaded");
        if (!fs.existsSync(uploadedDir)) {
            fs.mkdirSync(uploadedDir);
        }
        const sourcePath = path.join(productsDir, fileName);
        const destinationPath = path.join(uploadedDir, fileName);
        try {
            fs.renameSync(sourcePath, destinationPath);
            //console.log(`[5/5] Fichier '${fileName}' déplacé.`);
        } catch (err) {
            console.error(`[5/5] Erreur lors du déplacement du fichier '${fileName}':`, err);
        }
    }
}

main().catch((err) => {
    console.error("Erreur globale :", err);
    process.exit(1);
});