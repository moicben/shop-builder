import { createContent } from "./createContent.js";
import { uploadShop } from "./uploadContent.js";
import { createProperty } from "./../utils/vercel/createProperty.js";
import { supabase } from "./../utils/supabase.js";

async function main() {
    // Étape 1 : Génération des données via createContent.js
    console.log("Génération des données de shop...");
    const shopObjects = await createContent();
    console.log(`Données générées pour ${shopObjects} shops.`);
    
    // Étape 2 : Upload des shops et contenus avec uploadContent.js
    console.log("Démarrage de l'upload des shops et contenus...");
    await uploadShop(shopObjects);
    console.log("Upload terminé.");
    
    // Étape 3 : Sélectionner uniquement les shops traités pour créer leur propriété Vercel
    const domains = shopObjects.map(obj => obj.shopData.domain);
    const { data: shops, error } = await supabase
        .from("shops")
        .select("*")
        .in("domain", domains);
        
    if (error) {
        console.error("Erreur lors de la récupération des shops :", error);
        process.exit(1);
    }
    
    for (const shop of shops) {
        try {
            console.log(`Création de la propriété Vercel pour le shop '${shop.name}'...`);
            const result = await createProperty(shop, "mano-store");
            console.log(`Propriété créée pour le shop '${shop.name}':`, result);
        } catch (err) {
            console.error(`Erreur lors de la création de la propriété pour le shop ${shop.id}:`, err);
        }
    }
}

main().catch((err) => {
    console.error("Erreur globale :", err);
    process.exit(1);
});