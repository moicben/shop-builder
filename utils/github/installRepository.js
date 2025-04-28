import { execCommand } from '../execCommand.js';
import fs from 'fs';
import path from 'path';

export async function installRepository(sourceRepoDir, REPO_ORIGIN) {
    // Clone le repo source dans build-temp/source s'il n'existe pas
    if (!fs.existsSync(sourceRepoDir)) {
        console.log(`Clonage du dépôt ${sourceRepoDir}...`);
        execCommand(`git clone ${REPO_ORIGIN} ${sourceRepoDir}`, { stdio: 'ignore' });
        // Installation une seule fois
        process.chdir(sourceRepoDir);
        //console.log("Installation des dépendances du dépôt source...");
        execCommand("npm install", { stdio: 'ignore' });
        // Revenir au répertoire de travail d'origine
        process.chdir(path.resolve(".."));
    } else {
        console.log(`Le dépôt ${sourceRepoDir} existe déjà...`);
    }
}