import fs from 'fs';
import path from 'path';
import dotenv from "dotenv";

import { getAccessToken } from "../google/getAccessToken.js";
import { createRepository } from './createRepository.js';
import { publishRepository } from './publishRepository.js';
import { execCommand } from '../execCommand.js';

dotenv.config();

export async function deployRepository(shop, sourceRepoDir) {
    // Nous partons du principe que installRepository.js a cloné et installé les dépendances dans ce dossier
    process.chdir(sourceRepoDir);

    // Définition des variables d'environnement pour le build spécifique au shop
    const envVars = {
        SHOP_ID: shop.id.toString(),
        GOOGLE_REFRESH_TOKEN_WEBMASTER: await getAccessToken()
    };

    // (Optionnel) Nettoyer l'ancien dossier "out" s'il existe pour éviter les conflits
    const outDir = path.join(sourceRepoDir, 'out');
    if (fs.existsSync(outDir)) {
        fs.rmSync(outDir, { recursive: true, force: true });
        console.log('Ancien dossier "out" supprimé.');
    }

    // Build et export du site statique Next.js avec les variables d'environnement spécifiques
    console.log('Building the site for shop:', shop.domain);
    const buildEnv = Object.assign({}, process.env, envVars);
    execCommand('npm run build', { env: buildEnv });

    // Attendre que le build soit terminé
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Vérifier l'existence du dossier "out"
    if (!fs.existsSync(outDir)) {
        console.error('Error: "out" folder not found. Make sure the Next.js export was successful.');
        process.exit(1);
    }

    // Créer le fichier CNAME dans le dossier "out" pour définir le domaine personnalisé
    fs.writeFileSync(path.join(outDir, 'CNAME'), shop.domain);
    console.log(`Custom domain "${shop.domain}" written to CNAME file.`);

    // Préparer le déploiement de l'export statique
    process.chdir(outDir);
    execCommand('git init');
    execCommand('git add .');
    execCommand('git commit -m "Deploy static Next.js site"');

    const newRepoUrl = `https://github.com/moicben/${shop.domain}`;
    console.log(`Creating the repository ${newRepoUrl}...`);
    await createRepository(shop.domain);

    execCommand(`git remote add origin git@github.com:moicben/${shop.domain}.git`);
    execCommand('git branch -M main');
    execCommand('git push -u origin main --force');

    console.log('Deployment completed successfully.');

    // Publier sur GitHub Pages
    await publishRepository(shop.domain);
}