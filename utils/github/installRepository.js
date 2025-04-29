import { execCommand } from '../execCommand.js';
import fs from 'fs';
import path from 'path';

export async function installRepository(sourceRepoDir, REPO_ORIGIN) {
    // Clone le repo source dans le dossier sourceRepoDir s'il n'existe pas
    if (!fs.existsSync(sourceRepoDir)) {
        console.log(`Clonage du dépôt ${sourceRepoDir}...`);
        execCommand(`git clone ${REPO_ORIGIN} ${sourceRepoDir}`, { stdio: 'ignore' });
        // Installation des dépendances dans le répertoire cloné sans changer le répertoire globalement
        execCommand("npm install", { stdio: 'ignore', cwd: sourceRepoDir });
    } else {
        console.log(`Le dépôt ${sourceRepoDir} existe déjà...`);
    }
}