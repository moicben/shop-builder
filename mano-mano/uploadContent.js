import { supabase } from '../utils/supabase.js'
import { getCount } from '../utils/supabase/getCount.js';


/**
 * Upload des données de shop passées en paramètre.
 * @param {Array} shopObjects - Tableau d'objets contenant shopData, contentData et productsData
 */
export async function uploadShop(shopObjects) {
    for (let i = 0; i < shopObjects.length; i++) {
        const shopObj = shopObjects[i];
        const { fileName, shopData, contentData, productsData } = shopObj;

        // Obtention de l'id du shop à partir de la table "shops"
        shopData.id = await getCount('shops') + 1;
        
        // Etape 1 : Créer le shop dans la table "shops"
        const { data: shopInserted, error: shopError } = await supabase
            .from('shops')
            .insert(shopData)
            .select();
            
        if (shopError || !shopInserted || shopInserted.length === 0) {
            console.error(`Erreur lors de l'insertion du shop pour ${fileName}:`, shopError);
            continue;
        }
        
        const shopId = shopInserted[0].id;
        // Mise à jour de l'objet shop pour que builder.js puisse avoir accès à l'id
        shopObj.shopData.id = shopId;
        
        // Etape 2 : Insérer dans la table "contents" sans assigner manuellement un id
        const contentRecord = {
            shop_id: shopId,
            heroTitle: contentData.heroTitle,
            heroDesc: contentData.heroDesc,
            heroMedia: contentData.heroMedia
        };
        
        const { data: contentInserted, error: contentError } = await supabase
            .from('contents')
            .insert(contentRecord)
            .select();
            
        if (contentError) {
            console.error(`Erreur lors de l'insertion dans contents pour ${fileName}:`, contentError);
            continue;
        }
        
        // Etape 3 : Insérer les produits dans la table "products" sans spécifier manuellement l'id
        for (let j = 0; j < productsData.length; j++) {
            const product = productsData[j];
            const productRecord = {
                shop_id: shopId,
                category_id: 6,
                title: product.title,
                desc: product.desc,
                slug: product.slug,
                images: product.images,
                more1: product.more1,
                price: product.price,
                discounted: product.discounted,
                bestseller: false,
                metaTitle: product.metaTitle
            };
            
            const { error: productError } = await supabase
                .from('products')
                .insert(productRecord);
            
            if (productError) {
                console.error(`Erreur lors de l'insertion du produit "${product.title}" pour ${fileName}:`, productError);
            }
        }
    }
}