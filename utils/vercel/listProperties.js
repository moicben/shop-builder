import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.VERCEL_TOKEN) {
  console.error("VERCEL_TOKEN n'est pas défini. Veuillez le définir dans vos variables d'environnement.");
  process.exit(1);
}

async function listProperties() {
  const apiKey = process.env.VERCEL_TOKEN;
  try {
    // Appel à l'API Vercel pour récupérer la liste des projets
    const res = await fetch("https://api.vercel.com/v9/projects", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(`Échec de la récupération des projets: ${res.status} - ${JSON.stringify(errData)}`);
    }
    
    const { projects } = await res.json();
    console.log("Liste des propriétés (projects) existantes :");
    projects.forEach(project => {
      console.log(`ID: ${project.id} - Nom: ${project.name}`);
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétés :", error);
  }
}

listProperties();