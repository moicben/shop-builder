import fetch from "node-fetch"; // If running on Node <18, otherwise remove this import
//import { fetchData } from "./../supabase.js";

if (!process.env.VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is not set. Please set it in your environment variables.");
}

/**
 * Crée une nouvelle propriété Vercel à partir du dépôt et déploie le projet.
 * Retourne aussi les informations DNS à utiliser pour connecter le domaine.
 * @param {Object} shop - Le shop pour lequel créer la propriété.
 * @returns {Promise<Object>} - Les détails du projet, du déploiement et les infos DNS.
 */
export async function createProperty(shop, repository) {
    console.log(`Création de la propriété Vercel pour le shop: ${JSON.stringify(shop)}...`);
    
    try {
        const apiKey = process.env.VERCEL_TOKEN;
        // Conversion du nom du shop pour respecter les guidelines Vercel.
        const projectName = shop.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/ /g, "-")
            .slice(0, 99);
            
        const data = {
            name: projectName,
            environmentVariables: [
                {
                    key: "CUSTOM_DOMAIN",
                    value: shop.domain,
                    target: ["production"],
                    type: "plain"
                },
                {
                    key: "SHOP_ID",
                    value: shop.id.toString(),
                    target: ["production"],
                    type: "plain"
                },
                {
                    key: "SUPABASE_URL",
                    value: "https://bpybtzxqypswjiizkzja.supabase.co",
                    target: ["production"],
                    type: "plain"
                },
                {
                    key: "SUPABASE_KEY",
                    value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJweWJ0enhxeXBzd2ppaXpremphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NDE1NjYsImV4cCI6MjA1ODExNzU2Nn0.08Uh9FjenwJ23unlZxyXDDDf4ZurGPjZai1cKBB6r9o",
                    target: ["production"],
                    type: "plain"
                },
            ],
            framework: "nextjs",
            gitRepository: {
                type: "github",
                repo: `moicben/${repository}`,
            },
        };

        // Créer le projet sur Vercel
        const res = await fetch("https://api.vercel.com/v9/projects", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(`Project creation failed: ${res.status} - ${JSON.stringify(errData)}`);
        }
        
        const project = await res.json();
        console.log(`Projet créé avec succès pour "${shop.name}":`, project);

        // Ajouter un domaine personnalisé
        const domainRes = await fetch(`https://api.vercel.com/v9/projects/${project.id}/domains`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: shop.domain
            })
        });

        if (!domainRes.ok) {
            const errDomain = await domainRes.json();
            throw new Error(`L'ajout du domaine personnalisé a échoué: ${domainRes.status} - ${JSON.stringify(errDomain)}`);
        }

        const domainResult = await domainRes.json();
        console.log(`Domaine personnalisé "${shop.domain}" ajouté avec succès:`, domainResult);

        // Déployer le projet
        const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                gitSource: {
                    ref: "master",
                    repoId: project.link.repoId,
                    type: "github"
                },
                name: data.name,
                projectSettings: {
                    framework: data.framework,
                    buildCommand: "next build && npm run generate-sitemap"
                }
            })
        });
        
        if (!deployRes.ok) {
            const errData = await deployRes.json();
            throw new Error(`Deployment failed: ${deployRes.status} - ${JSON.stringify(errData)}`);
        }
        
        const deployment = await deployRes.json();
        console.log(`Déploiement créé pour "${shop.name}":`, deployment);
        
        // Informations DNS pour pointer vers Vercel (exemple)
        const vercelDnsInfo = {
            cname: "cname.vercel-dns.com"
        };
        
        return { project, deployment, vercelDnsInfo };
    } catch (error) {
        console.error("Erreur lors de la création de la propriété Vercel :", error);
        throw error;
    }
}