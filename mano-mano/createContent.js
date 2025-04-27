import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { create } from 'domain';
import { findBanner } from './findBanner.js';

dotenv.config();

// Configurez votre clé API OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const productsDir = path.join(process.cwd(), 'mano-mano', 'json', 'products');
const categoriesFilePath = path.join(process.cwd(), 'mano-mano', 'json', 'categories.json');

/**
 * Appelle OpenAI pour générer le contenu de la catégorie.
 */
export async function generateContent(fileName, productsContent) {
  const prompt = `À partir du fichier JSON de produits "${fileName}" dont le contenu est ${JSON.stringify(productsContent).slice(0, 1000)}..., génère en français :
- Un titre de catégorie optimisé pour le SEO (maximum 50 caractères)
- Une description de la catégorie explicite et aguicheuse (260 à 320 caractères)

Réponds uniquement en JSON au format:
{
  "title": "...",
  "description": "...",
}`;
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Tu es un assistant de traduction de contenu e-commerce.' },
      { role: 'user', content: prompt }
    ],
  });
  const content = response.choices[0].message.content.trim();
  try {
    return JSON.parse(content);
  } catch (parseError) {
    throw new Error(`Erreur de parsing de la réponse OpenAI: ${parseError}. Réponse reçue: ${content}`);
  }
}

/**
 * Parcourt le dossier produits et prépare les données pour upload.
 * Retourne un tableau d'objets contenant :
 * - fileName
 * - shopData (pour la table shops)
 * - contentData (pour la table contents)
 * - productsData (pour la table products)
 */
export async function createContent() {
  // Lecture des catégories depuis categories.json
  const categoriesData = JSON.parse(fs.readFileSync(categoriesFilePath, 'utf8'));
  
  // Récupère la liste des fichiers dans le dossier des produits
  const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.json'));
  
  const shopObjects = [];
  
  for (const fileName of files) {
    const filePath = path.join(productsDir, fileName);
    
    // Lit le contenu du fichier JSON
    const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Appelle OpenAI pour générer le contenu de la catégorie
    let categoryData;
    try {
      categoryData = await generateContent(fileName, fileContent);
      //console.log("Contenu généré :", categoryData);
    } catch (err) {
      console.error(`Erreur génération de contenu, retry`)// ${fileName}:`, err);
      // Réessayer au cas de problème
      try {
        //console.log(`Nouvelle tentative pour générer le contenu pour ${fileName}...`);
        categoryData = await generateContent(fileName, fileContent);
        //console.log("Contenu généré après nouvelle tentative :", categoryData);
      } catch (retryErr) {
        console.error(`Nouvel échec génération pour ${fileName}:`)//, retryErr);
        continue; // Passe au fichier suivant en cas d'échec répété
      }
    }
    
    // Prépare shopData
    const slugSubDomain = fileName
      .replace(/\.json$/, '')
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/--/g, "-")
      .slice(0, 26);

    const shopData = {
      name: `${categoryData.title} Mano Mano`,
      domain: `${slugSubDomain}.mano-mano.store`
    };

    // Récupérer l'URL du premier produit (propriété "url") du JSON traité
    let productUrl = "";
    if (fileContent.length > 0 && fileContent[0].url) {
      productUrl = fileContent[0].url;
    }
    //console.log("URL du 1er produit :", productUrl);

    // Obtenir bannerUrl via le premnier produit
    const categoryImage = await findBanner(productUrl);
    //console.log("Image de la catégorie :", categoryImage);
    
    // Prépare contentData en utilisant categoryData généré par OpenAI et la banner récupérée
    const contentData = {
      heroTitle: categoryData.title,
      heroDesc: categoryData.description,
      heroMedia: categoryImage
    };



    // BOUCLAGE PRODUIT : Prépararation de "productsData"
    const productsData = fileContent.map(product => {
      try {
        const originalPrice = parseFloat(product.originalPrice.replace(',', '.').replace(/\s|\u202f/g, ''));
        const discountedPrice = parseFloat(product.price.replace(',', '.').replace(/\s|\u202f/g, ''));
        //console.log(`Produit: ${product.title}, Prix extrait: ${product.price}, Prix converti: ${discountedPrice}`);

        // Création de slug pour chaque produit
        let productSlug = product.title
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/--/g, "-")
                  .replace(/[^a-z0-9-]/g, "")
                  .slice(0, 99);


        // Clean des features
        //product.desc = product.desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/"/g,'').trim();

        // Changement URL des images
        product.images = product.images.map(image => {
          return image.replace(/\/T\//g, '/L/');
        });

        // clean des details
        product.details ? product.details.replace(/<p>"<\/p>/g, "") : null

                

        return {
          title: product.title,
          //desc: product.features,
          slug: productSlug,
          images: product.images,
          more1: product.details,
          price: discountedPrice,     // prix converti (price)
          discounted: originalPrice,  // originalPrice converti (discounted)
          metaTitle: product.title
        };
      } catch (err) {
        console.error(`Erreur récupération produit : ${product.title}`)//:`, err);
        return null; // Ignore le produit en cas d'erreur
      }
    });
    
    shopObjects.push({
      fileName,
      shopData,
      contentData,
      productsData
    });

    //console.log(`${shopObjects.length}/${files.length} rédigé.`);
  }

  
  return shopObjects;
}

// createContent().catch(err => {
//   console.error('Erreur lors de la création du contenu:', err);
// })