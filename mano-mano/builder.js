import fs from "fs";
import path from "path";

import { createContent } from "./createContent.js";
import { uploadShop } from "./uploadContent.js";
import { deployRepository } from "./../utils/github/deployRepository.js";
import { indexSite } from "../utils/google/indexSite.js";
import { installRepository } from "./../utils/github/installRepository.js";

// Définition des répertoires importants
const productsDir = path.join(process.cwd(), "mano-mano", "json", "products");
const REPO_ORIGIN = "https://github.com/moicben/mano-store.git";

async function processFile(fileName, fileIndex, totalFiles, sourceRepoDir) {
    console.log(`\n=== ${fileIndex + 1}/${totalFiles} : ${fileName} ===`);
    
    // Étape 1 : Création du contenu shop via le JSON
    console.log("-> [1/5] Génération du contenu");
    const shopObj = await createContent(fileName);
    const shop = shopObj.shopData;
    
    // Étape 2 : Upload du shop et contenus
    console.log("-> [2/5] Upload sur Supabase");
    await uploadShop([shopObj]);
    
    // Étape 3 : Déploiement Github Pages
    console.log("-> [3/5] Déploiement Github");
    try {
        await deployRepository(shop, sourceRepoDir);
    } catch (err) {
        console.error(`[3/5] Erreur de création de propriété pour '${shop.name}':`, err);
    }
    
    // Étape 4 : Indexation via Google Search Console
    console.log("-> [4/5] Indexation Console");
    try {
        await indexSite(shop.domain);
    } catch (err) {
        console.error(`[4/5] Erreur lors de l'indexation '${shop.name}':`, err);
    }
    
    // Étape 5 : Déplacement du fichier JSON traité dans le sous-répertoire /uploaded
    console.log("-> [5/5] Déplacement du JSON");
    const uploadedDir = path.join(productsDir, "uploaded");
    if (!fs.existsSync(uploadedDir)) {
        fs.mkdirSync(uploadedDir);
    }
    const sourcePath = path.join(productsDir, fileName);
    const destinationPath = path.join(uploadedDir, fileName);
    try {
        fs.renameSync(sourcePath, destinationPath);
    } catch (err) {
        console.error(`[5/5] Erreur lors du déplacement du fichier '${fileName}':`, err);
    }
}

async function main() {
    console.log("--- Lancement du builder Mano Mano ---");
    
    const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.json'));
    console.log(`Nombre de fichiers à traiter: ${files.length}`);
    
    const totalFiles = files.length;
    
    // Diviser les fichiers en 4 groupes basés sur l'indice modulo 4
    const groups = [[], [], [], []];
    files.forEach((file, index) => {
        groups[index % 4].push({ file, index });
    });
    
    // Lancer les 4 groupes en parallèle, avec un décalage de 3 secondes pour chacun
    const groupTasks = groups.map((group, groupIndex) =>
        new Promise(async (resolve) => {
            // Délai avant le lancement du groupe (ex : 0ms, 3000ms, 6000ms, 9000ms)
            await new Promise(r => setTimeout(r, groupIndex * 3000));
            
            const repoDir = path.resolve("build-temp", String(groupIndex + 1));
            console.log(`[0/5] Initialisation dépôt groupe ${groupIndex + 1}...`);
            await installRepository(repoDir, REPO_ORIGIN);
            
            // Traiter les fichiers du groupe un par un (séquentiellement)
            for (const { file, index } of group) {
                await processFile(file, index, totalFiles, repoDir);
            }
            resolve();
        })
    );
    
    await Promise.all(groupTasks);
}

main().catch((err) => {
    console.error("Erreur globale :", err);
    process.exit(1);
});