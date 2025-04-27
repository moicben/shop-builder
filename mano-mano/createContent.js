import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { findBanner } from './findBanner.js';

dotenv.config();

// Configurez votre clé API OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const productsDir = path.join(process.cwd(), 'mano-mano', 'json', 'products');
const categoriesFilePath = path.join(process.cwd(), 'mano-mano', 'json', 'categories.json');

/**
 * Appelle OpenAI pour générer le contenu de la catégorie pour le fichier donné.
 */
export async function generateContent(fileName, productsContent) {
  const prompt = `À partir du fichier JSON de produits "${fileName}" dont le contenu est ${JSON.stringify(productsContent).slice(0, 1000)}..., génère en français :
- Un titre de catégorie optimisé pour le SEO (maximum 50 caractères)
- Une description de la catégorie explicite et aguicheuse (200 à 300 caractères)
- Un slug le plus simple possible pour le sous-domaine basé sur le nom du fichier (maximum 22 caractères)

Réponds uniquement en JSON dans le format suivant exactement :
{
  "title": "...",
  "description": "...",
  "slug": "..."
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Tu es un assistant de traduction de contenu e-commerce.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5,
  });
  const content = response.choices[0].message.content.trim();
  try {
    return JSON.parse(content);
  } catch (parseError) {
    throw new Error(`Erreur de parsing de la réponse OpenAI: ${parseError}. Réponse reçue: ${content}`);
  }
}

/**
 * Traite un fichier de produits et prépare les données pour upload.
 * Retourne un objet contenant :
 * - fileName
 * - shopData (pour la table shops)
 * - contentData (pour la table contents)
 * - productsData (pour la table products)
 */
export async function createContent(fileName) {
  const filePath = path.join(productsDir, fileName);
  const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Appel OpenAI pour générer le contenu de la catégorie
  let categoryData;
  try {
    categoryData = await generateContent(fileName, fileContent);
  } catch (err) {
    //console.error(`Erreur génération de contenu pour ${fileName}, nouvelle tentative...`);
    try {
      categoryData = await generateContent(fileName, fileContent);
    } catch (retryErr) {
      console.error(`Échec génération contenu : ${fileName}`)//:`, retryErr);
      return null;
    }
  }

  const shopData = {
    name: `${categoryData.title} Mano Mano`,
    domain: `${categoryData.slug}.mano-mano.store`
  };

  // Récupère l'URL du premier produit
  let productUrl = "";
  if (fileContent.length > 0 && fileContent[0].url) {
    productUrl = fileContent[0].url;
  }

  // Obtention de la banner via le produit
  const categoryImage = await findBanner(productUrl);

  // Prépare contentData
  const contentData = {
    heroTitle: categoryData.title,
    heroDesc: categoryData.description,
    heroMedia: categoryImage
  };

  // Préparation de "productsData"
  const productsData = fileContent.map(product => {
    try {
      const originalPrice = parseFloat(product.originalPrice.replace(',', '.').replace(/\s|\u202f/g, ''));
      const discountedPrice = parseFloat(product.price.replace(',', '.').replace(/\s|\u202f/g, ''));
      let productSlug = product.title
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/--/g, "-")
                .replace(/[^a-z0-9-]/g, "")
                .slice(0, 99);
      product.images = product.images.map(image => image.replace(/\/T\//g, '/L/'));
      if (product.details) {
        product.details = product.details.replace(/<p>"<\/p>/g, "");
      }
      return {
        title: product.title,
        slug: productSlug,
        images: product.images,
        more1: product.details,
        price: discountedPrice,
        discounted: originalPrice,
        metaTitle: product.title
      };
    } catch (err) {
      console.error(`Erreur récupération produit : ${product.title}`, err);
      return null;
    }
  });

  return {
    fileName,
    shopData,
    contentData,
    productsData
  };
}