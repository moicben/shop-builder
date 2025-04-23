import { newShops } from "./newShops.js";
import { listFieldsWithContents } from "./listFields.js";
import { translateContent } from "./translateContent.js";
import { createProperty } from "../christopeit/createProperty.js";
import { storeShop } from "./storeShop.js"; // Import de la fonction storeShop
import { indexShop } from "./indexShop.js"; // Import de la fonction indexShop

export async function mainProcess() {
  console.log("Début du processus de déploiement automatisé...");

  // Étape 1 : Définir les nouveaux shops
  const shops = await newShops();

  // Étape 1.bis : Définir le shop modèle
  const templateShopId = 1; // ID du shop modèle

  // Étape 2 : Début boucle pour chaque shop
  for (let shop of shops) {
    console.log(`Traitement pour le shop : ${shop.name}`);

    // Récupération des champs et contenus pour le shop modèle
    const fieldsWithContents = await listFieldsWithContents(templateShopId);

    // Traduction de toutes les lignes pour chaque champ
    const translatedData = {};
    for (const [table, fields] of Object.entries(fieldsWithContents)) {
      if (!translatedData[table]) translatedData[table] = {};
      for (const [field, items] of Object.entries(fields)) {
        if (!items || items.length === 0) continue;
        translatedData[table][field] = [];
        for (let i = 0; i < items.length; i++) {
          const value = items[i].value;
          console.log(`[${table}/${field}] ligne ${i + 1} : ${value}`);
          // On passe le champ en troisième paramètre
          const translatedValue = await translateContent(value, shop.country, field);
          translatedData[table][field].push({
            ...items[i],
            translated_value: translatedValue,
          });
        }
      }
    }

    // Ensuite, vous pouvez passer translatedData à storeShop()
    shop = await storeShop(shop, translatedData, templateShopId);

    // Étape 6 : Créer une propriété Vercel pour le shop actuel avec un domaine personnalisé
    const property = await createProperty(shop);
    console.log(`Propriété Vercel créée pour le shop "${shop.name}" :`, property);

    // Étape 7 : Créer une proprété Search Console pour le shop actuel et indexer son sitemap
    const indexResult = await indexShop(shop.domain);
    console.log(`Search Console créé et indexe pour le shop "${shop.name}" :`, indexResult);

    // Nouvelle étape : Acheter et configurer le domaine via GoDaddy en utilisant les infos DNS retournées
    // const domainResult = await buyDomain(shop, property.vercelDnsInfo);
    // console.log(`Domaine acheté et DNS configuré pour le shop "${shop.name}" :`, domainResult);
  }

  console.log("Processus terminé avec succès !");
}

mainProcess();