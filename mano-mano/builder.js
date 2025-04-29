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

async function processFile(fileName, fileIndex, totalFiles, sourceRepoDir, groupId) {
    console.log(`\n[Groupe ${groupId}] === ${fileIndex + 1}/${totalFiles} : ${fileName} ===`);
    
    console.log(`[Groupe ${groupId}] -> [1/5] Génération du contenu`);
    const shopObj = await createContent(fileName);
    const shop = shopObj.shopData;
    
    console.log(`[Groupe ${groupId}] -> [2/5] Upload sur Supabase`);
    await uploadShop([shopObj]);
    
    console.log(`[Groupe ${groupId}] -> [3/5] Déploiement Github`);
    try {
        await deployRepository(shop, sourceRepoDir);
    } catch (err) {
        console.error(`[Groupe ${groupId}] [3/5] Erreur de création de propriété pour '${shop.name}':`, err);
    }
    
    console.log(`[Groupe ${groupId}] -> [4/5] Indexation Console`);
    try {
        await indexSite(shop.domain);
    } catch (err) {
        console.error(`[Groupe ${groupId}] [4/5] Erreur lors de l'indexation '${shop.name}':`, err);
    }
    
    console.log(`[Groupe ${groupId}] -> [5/5] Déplacement du JSON`);
    const uploadedDir = path.join(productsDir, "uploaded");
    if (!fs.existsSync(uploadedDir)) {
        fs.mkdirSync(uploadedDir);
    }
    const sourcePath = path.join(productsDir, fileName);
    const destinationPath = path.join(uploadedDir, fileName);
    try {
        fs.renameSync(sourcePath, destinationPath);
    } catch (err) {
        console.error(`[Groupe ${groupId}] [5/5] Erreur lors du déplacement du fichier '${fileName}':`, err);
    }
}

async function main() {
    console.log("--- Lancement du builder Mano Mano ---");
    
    const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.json'));
    console.log(`Nombre de fichiers à traiter: ${files.length}`);
    
    const totalFiles = files.length;
    
    // Diviser les fichiers en XX groupes parrallèles
    const groupCount = 3;
    const groups = Array.from({ length: groupCount }, () => []);
    files.forEach((file, index) => {
        groups[index % groupCount].push({ file, index });
    });
    
    // Lancer les groupes en parallèle, avec un décalage de 3 secondes 
    const groupTasks = groups.map((group, groupIndex) =>
        new Promise(async (resolve) => {
            // Délai avant le lancement (0ms, 3000ms, 6000ms, 9000ms)
            await new Promise(r => setTimeout(r, groupIndex * 3000));
            
            const repoDir = path.resolve("build-temp", String(groupIndex + 1));
            const groupId = groupIndex + 1;
            console.log(`[Groupe ${groupId}] [0/5] Initialisation dépôt groupe ${groupId}...`);
            await installRepository(repoDir, REPO_ORIGIN);
            
            // Traiter les fichiers du groupe un par un (séquentiellement)
            for (const { file, index } of group) {
                await processFile(file, index, totalFiles, repoDir, groupId);
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