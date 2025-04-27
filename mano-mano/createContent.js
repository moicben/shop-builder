import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';

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
- Une description de la catégorie explicite et aguicheuse (200 à 300 caractères)
- Un slug pour sous-domaine basé sur le nom du fichier

Réponds uniquement en JSON au format:
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
    console.log(`Traitement du fichier: ${fileName}`);
    
    // Lit le contenu du fichier JSON
    const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Appelle OpenAI pour générer le contenu de la catégorie
    let categoryData;
    try {
      categoryData = await generateContent(fileName, fileContent);
      console.log("Contenu généré :", categoryData);
    } catch (err) {
      console.error(`Erreur lors de la génération du contenu pour ${fileName}:`, err);
      continue;
    }
    
    // Prépare shopData
    const shopData = {
      name: `${categoryData.title} Mano Mano`,
      domain: `${categoryData.slug}.mano-mano.store`
    };


    // On initialise categoryImage à null
    let categoryImage = 'https://lareclame.fr/wp-content/uploads/2025/03/manomano-marseillaise-affichage-3-1-1600x1227.png';
    
    // Prépare contentData (sans id, qui sera défini lors de l'upload)
    const contentData = {
      heroTitle: categoryData.title,
      heroDesc: categoryData.description,
      heroMedia: categoryImage
    };

    // Bouclage des produits

    // Prépare productsData en convertissant les prix
    const productsData = fileContent.map(product => {
      const originalPrice = parseFloat(product.originalPrice.replace(',', '.'));
      const discountedPrice = parseFloat(product.price.replace(',', '.'));

      // Création de slug pour chaque produit
      let productSlug = product.title
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/--/g, "-")
                .replace(/[^a-z0-9-]/g, "")
                .slice(0, 99);

      // Changement URL des images
      product.images = product.images.map(image => {
        return image.replace(/\/T\//g, '/L/');
      });
                  

      return {
        title: product.title,
        desc: product.features,
        slug: productSlug,
        images: product.images,
        more1: product.details,
        price: discountedPrice,     // prix converti (price)
        discounted: originalPrice,  // originalPrice converti (discounted)
        metaTitle: product.title
      };
    });
    
    shopObjects.push({
      fileName,
      shopData,
      contentData,
      productsData
    });
  }
  
  return shopObjects;
}