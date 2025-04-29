import fs from 'fs';
import path from 'path';
import dotenv from "dotenv";

import { getAccessToken } from "../google/getAccessToken.js";
import { createRepository } from './createRepository.js';
import { publishRepository } from './publishRepository.js';
import { execCommand } from '../execCommand.js';

dotenv.config();

export async function deployRepository(shop, sourceRepoDir) {
    // Définition des variables d'environnement pour le build spécifique au shop
    const envVars = {
        SHOP_ID: shop.id.toString(),
        GOOGLE_REFRESH_TOKEN_WEBMASTER: await getAccessToken()
    };

    // (Optionnel) Nettoyer l'ancien dossier "out" s'il existe pour éviter les conflits
    const outDir = path.join(sourceRepoDir, 'out');
    if (fs.existsSync(outDir)) {
        fs.rmSync(outDir, { recursive: true, force: true });
    }

    // Build et export du site statique Next.js avec les variables d'environnement spécifiques
    const buildEnv = Object.assign({}, process.env, envVars);
    await execCommand('npm run build', { env: buildEnv, stdio: 'ignore', cwd: sourceRepoDir });

    // Attendre que le build soit terminé
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Vérifier l'existence du dossier "out"
    if (!fs.existsSync(outDir)) {
        console.error('Error: "out" folder not found. Make sure the Next.js export was successful.');
        process.exit(1);
    }

    // Créer le fichier CNAME dans le dossier "out" pour définir le domaine personnalisé
    fs.writeFileSync(path.join(outDir, 'CNAME'), shop.domain);

    // Préparer le déploiement de l'export statique en utilisant l'option cwd
    await execCommand('git init', { stdio: 'ignore', cwd: outDir });
    await execCommand('git add .', { stdio: 'ignore', cwd: outDir });
    await execCommand('git commit -m "Deploy static Next.js site"', { stdio: 'ignore', cwd: outDir });

    const newRepoUrl = `https://github.com/moicben/${shop.domain}`;
    await createRepository(shop.domain);

    await execCommand(`git remote add origin git@github.com:moicben/${shop.domain}.git`, { stdio: 'ignore', cwd: outDir });
    await execCommand('git branch -M main', { stdio: 'ignore', cwd: outDir });
    await execCommand('git push -u origin main --force', { stdio: 'ignore', cwd: outDir });

    // Publier sur GitHub Pages
    await publishRepository(shop.domain);

    // Plus besoin de revenir au répertoire d'origine
}