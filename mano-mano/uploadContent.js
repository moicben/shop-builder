import { supabase } from '../utils/supabase.js';

/**
 * Fonction pour récupérer le nombre de lignes d'une table
 */
async function getCount(tableName) {
    const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
    if (error) {
        throw new Error(`Erreur lors du comptage de ${tableName}: ${error.message}`);
    }
    return count;
}

/**
 * Upload des données de shop passées en paramètre.
 * @param {Array} shopObjects - Tableau d'objets contenant shopData, contentData et productsData
 */
export async function uploadShop(shopObjects) {
    for (const shopObj of shopObjects) {
        const { fileName, shopData, contentData, productsData } = shopObj;
        
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
        console.log(`Shop inséré avec l'ID: ${shopId} pour ${fileName}`);
        // Mise à jour de l'objet shop pour que builder.js puisse avoir accès à l'id
        shopObj.shopData.id = shopId;
        
        // Etape 2 : Insérer dans la table "contents"
        let contentsCount;
        try {
            contentsCount = await getCount('contents');
        } catch (countError) {
            console.error('Erreur lors du comptage de contents:', countError);
            continue;
        }
        const newContentId = contentsCount + 1;
        
        const contentRecord = {
            id: newContentId,
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
        console.log(`Insertion dans contents réussie pour ${fileName}`);
        
        // Etape 3 : Insérer les produits dans la table "products"
        let productsCount;
        try {
            productsCount = await getCount('products');
        } catch (prodCountError) {
            console.error('Erreur lors du comptage de products:', prodCountError);
            continue;
        }
        
        for (let i = 0; i < productsData.length; i++) {
            const product = productsData[i];
            const newProductId = productsCount + i + 1;
            
            const productRecord = {
                id: newProductId,
                shop_id: shopId,
                category_id: 16,
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
            } else {
                console.log(`Produit "${product.title}" inséré avec succès pour ${fileName}`);
            }
        }
    }
}

uploadShop().catch(err => {
    console.error("Erreur globale : ", err);
});