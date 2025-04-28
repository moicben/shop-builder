import fs from "fs";
import path from "path";

import { createContent } from "./createContent.js";
import { uploadShop } from "./uploadContent.js";
import { deployRepository } from "./../utils/github/deployRepository.js";
import { indexSite } from "../utils/google/indexSite.js";
import { installRepository } from "../utils/github/installRepository.js";


// Définition des répertoires importants
const productsDir = path.join(process.cwd(), "mano-mano", "json", "products");
const sourceRepoDir = path.resolve("build-temp");
const REPO_ORIGIN = "https://github.com/moicben/mano-store.git";

async function main() {
    console.log("--- Lancement du builder Mano Mano ---");
    
    // Récupération de la liste des fichiers
    const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.json'));
    console.log(`Nombre de fichiers à traiter: ${files.length}`);

    // Étape 0 : Clonage du dépôt source
    console.log("-> [0/5] Clonage du dépôt source <-");
    await installRepository(sourceRepoDir, REPO_ORIGIN);

    //

    // Boucle générale 
    for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        console.log(`\n=== Traitement du fichier ${fileName} (${i + 1}/${files.length}) ===`);

        // Étape 1 : Création du contenu shop via le JSON
        console.log("-> [1/5] Création du contenu");
        const shopObj = await createContent(fileName);
        const shop = shopObj.shopData;

        // Étape 2 : Upload du shop et contenus
        console.log("-> [2/5] Upload sur Supabase");
        // On passe un tableau contenant uniquement shopObj à uploadShop
        await uploadShop([shopObj]);

        // Étape 3 : Déploiement Gituh Pages
        console.log(`-> [3/5] Déploiement Github : ${shop.domain} <-`);
        try {
            await deployRepository(shop, sourceRepoDir);
        } catch (err) {
            console.error(`[3/5] Erreur de création de propriété pour '${shop.name}':`, err);
        }

        // Étape 4 : Indexation via Google Search Console
        console.log("-> [4/5] Indexation Search Console");
        try {
            await indexSite(shop.domain);
        } catch (err) {
            console.error(`[4/5] Erreur lors de l'indexation '${shop.name}':`, err);
        }

        // Étape 5 : Déplacement du fichier JSON traité dans le sous-répertoire /uploaded
        console.log("-> [5/5] Déplacement du fichier JSON  <-");
        const uploadedDir = path.join(productsDir, "uploaded");
        if (!fs.existsSync(uploadedDir)) {
            fs.mkdirSync(uploadedDir);
        }
        const sourcePath = path.join(productsDir, fileName);
        const destinationPath = path.join(uploadedDir, fileName);
        try {
            fs.renameSync(sourcePath, destinationPath);
        } catch (err) {
            console.error(`[6/5] Erreur lors du déplacement du fichier '${fileName}':`, err);
        }
    }
}

main().catch((err) => {
    console.error("Erreur globale :", err);
    process.exit(1);
});