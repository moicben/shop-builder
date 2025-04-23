import { title } from "process";
import { supabase } from "../utils/supabase.js"

/**
 * Insère une nouvelle boutique dans la table "shops", copie les données de "brands" du template,
 * et insère les données traduites dans les autres tables.
 * @param {Object} shop - Les informations de la boutique.
 * @param {Object} translatedData - Les données traduites pour les champs.
 * @param {number} templateShopId - L'ID du shop modèle (source pour "brands").
 * @returns {Promise<Object>} - L'objet shop mis à jour avec son ID.
 */
export async function storeShop(shop, translatedData, templateShopId) {
  console.log(`Insertion de la boutique "${shop.name}" dans la table "shops"...`);

  // Insérer la boutique dans la table "shops"
  const { data: shopData, error: shopError } = await supabase
    .from("shops")
    .insert({
      name: shop.name,
      domain: shop.domain,
      language: shop.language,
      currency: shop.currency,
      country: shop.country,
      address: shop.address,
      phone: shop.phone,
    })
    .select("id")
    .single();

  if (shopError) {
    throw new Error(`Erreur lors de l'insertion de la boutique "${shop.name}": ${shopError.message}`);
  }

  shop.id = shopData.id;
  console.log(`Boutique "${shop.name}" insérée avec l'ID : ${shop.id}`);

  // Copier les données de la table "brands" pour le shop modèle et les appliquer à la nouvelle boutique
  const { data: templateBrand, error: brandFetchError } = await supabase
    .from("brands")
    .select("*")
    .eq("shop_id", templateShopId)
    .single();

  if (brandFetchError) {
    throw new Error(`Erreur lors de la récupération du template dans "brands" pour shop_id ${templateShopId}: ${brandFetchError.message}`);
  }

  // Suppression de l'ID pour permettre l'insertion d'une nouvelle ligne et mise à jour de shop_id
  const { id, ...brandData } = templateBrand;
  const newBrandData = { ...brandData, shop_id: shop.id };

  const { error: insertBrandError } = await supabase
    .from("brands")
    .insert(newBrandData);

  if (insertBrandError) {
    throw new Error(`Erreur lors de l'insertion dans "brands" pour shop_id ${shop.id}: ${insertBrandError.message}`);
  }

  console.log(`Données de "brands" copiées depuis shop_id ${templateShopId} vers shop_id ${shop.id}`);

  // Insertion des données traduites dans chaque table
  for (const [table, fields] of Object.entries(translatedData)) {
    const fieldKeys = Object.keys(fields);
    if (fieldKeys.length === 0) continue;
    
    // Récupérer le nombre actuel d'enregistrements dans la table
    const { count: currentCount, error: countError } = await supabase
      .from(table)
      .select("*", { head: true, count: "exact" });
    if (countError) {
      throw new Error(`Erreur lors de la récupération du compte dans la table "${table}": ${countError.message}`);
    }
    
    // Déterminer le nombre de lignes à insérer (on suppose ici que tous les champs ont le même nombre de lignes)
    const count = fields[fieldKeys[0]].length;
    
    for (let i = 0; i < count; i++) {
      // Construire la ligne à insérer pour cette table et ce numéro de ligne
      let rowToInsert = { shop_id: shop.id };

      for (const field of fieldKeys) {
        const items = fields[field];
        if (items && items.length > i) {
          let value = items[i].translated_value;
          // Vérifier si le contenu est au format JSON
          try {
            const parsed = JSON.parse(value);
            rowToInsert[field] = parsed;
          } catch (e) {
            rowToInsert[field] = value;
          }
        }
      }
      
      // Supprimer toute éventuelle propriété "id" afin de laisser Supabase la définir automatiquement
      delete rowToInsert.id;
      //console.log(`Insertion dans "${table}" pour shop_id ${shop.id}, ligne ${i + 1}:`, rowToInsert);
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Calculer le nouvel id à partir du nombre actuel d'enregistrements
      const newId = currentCount + i + 1;
      
      const { error: insertError } = await supabase
        .from(table)
        .insert({
          id: newId,
          ...rowToInsert,
        });
      
      if (insertError) {
        throw new Error(`Erreur lors de l'insertion dans la table "${table}" pour shop_id ${shop.id}, ligne ${i + 1}: ${insertError.message}`);
      }
      
      console.log(`Nouvelle ligne insérée dans la table "${table}" pour shop_id ${shop.id}, ligne ${i + 1}`);
    }
  }
  
  return shop;
}