import fetch from "node-fetch"; // Si vous utilisez Node <18, sinon vous pouvez l'enlever
import dotenv from "dotenv";
dotenv.config();

if (!process.env.VERCEL_TOKEN) {
    console.error("VERCEL_TOKEN n'est pas défini. Veuillez le définir dans vos variables d'environnement.");
    process.exit(1);
}

/**
 * Supprime un projet Vercel à partir de son ID.
 * @param {string} projectId - L'ID du projet à supprimer.
 */
async function deleteProject(projectId) {
    const apiKey = process.env.VERCEL_TOKEN;
    console.log(`Suppression du projet avec l'ID : ${projectId}...`);

    const res = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(`Échec de la suppression du projet : ${res.status} - ${JSON.stringify(errData)}`);
    }

    console.log("Projet supprimé avec succès.");
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Veuillez fournir l'ID du projet à supprimer en argument.");
        process.exit(1);
    }
    const projectId = args[0];
    try {
        await deleteProject(projectId);
    } catch (error) {
        console.error("Erreur :", error);
        process.exit(1);
    }
}

main();
