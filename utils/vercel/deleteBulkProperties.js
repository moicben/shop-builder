import fetch from "node-fetch"; // Pour Node <18, sinon vous pouvez l'enlever
import dotenv from "dotenv";
dotenv.config();

if (!process.env.VERCEL_TOKEN) {
    console.error("VERCEL_TOKEN n'est pas défini. Veuillez le définir dans vos variables d'environnement.");
    process.exit(1);
}

const API_TOKEN = process.env.VERCEL_TOKEN;
const PROJECTS_API_URL = "https://api.vercel.com/v9/projects";

/**
 * Récupère la liste des projets Vercel.
 * @returns {Promise<Array>} La liste des projets.
 */
async function getProjects() {
    const res = await fetch(`${PROJECTS_API_URL}?limit=100`, {
        headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(`Échec de la récupération des projets: ${res.status} - ${JSON.stringify(errData)}`);
    }

    const data = await res.json();
    return data.projects || [];
}

/**
 * Supprime un projet Vercel à partir de son ID.
 * @param {string} projectId - L'ID du projet à supprimer.
 */
async function deleteProject(projectId) {
    console.log(`Suppression du projet avec l'ID : ${projectId}...`);

    const res = await fetch(`${PROJECTS_API_URL}/${projectId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(`Échec de la suppression du projet ${projectId}: ${res.status} - ${JSON.stringify(errData)}`);
    }

    console.log(`Projet ${projectId} supprimé avec succès.`);
}

/**
 * Supprime tous les projets dont le nom contient "mano-mano".
 */
async function deleteBulkProperties() {
    try {
        const projects = await getProjects();
        const projectsToDelete = projects.filter(project =>
            project.name && project.name.includes("mano-mano")
        );

        if (projectsToDelete.length === 0) {
            console.log('Aucun projet avec "mano-mano" dans le nom n’a été trouvé.');
            return;
        }

        console.log(`Nombre de projets à supprimer: ${projectsToDelete.length}`);
        for (const project of projectsToDelete) {
            try {
                await deleteProject(project.id);
            } catch (error) {
                console.error("Erreur lors de la suppression:", error.message);
            }
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des projets:", error.message);
    }
}

deleteBulkProperties();