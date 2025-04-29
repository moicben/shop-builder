import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function deleteRepository(repoName) {
    const token = process.env.GITHUB_TOKEN; // Vérifiez que le token est défini dans vos variables d'environnement
    if (!token) {
        console.error("GITHUB_TOKEN is not set in your environment.");
        process.exit(1);
    }
    
    const url = `https://api.github.com/repos/moicben/${repoName}`;
    
    try {
        const response = await axios.delete(url, {
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json"
            }
        });
        console.log(`Repository '${repoName}' deleted successfully:`, response.data);
    } catch (error) {
        console.error(`Failed to delete repository '${repoName}':`, error.response ? error.response.data : error.message);
    }
}

// Si le script est lancé directement depuis la ligne de commande,
// on récupère les arguments et on supprime les dépôts indiqués.
const repositories = process.argv.slice(2);
if (repositories.length === 0) {
    console.error("Aucun nom de répertoire fourni.\nUsage : node deleteRepositories.js repoName1 repoName2 ...");
    process.exit(1);
}
(async () => {
    for (const repo of repositories) {
        await deleteRepository(repo);
    }
})();
