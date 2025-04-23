import { fetchData } from "./supabase.js";

/**
 * Récupère le contenu actuel des champs à traduire.
 * @param {string} field - Le champ à récupérer.
 * @param {number} shopId - L'ID du shop pour lequel récupérer les données.
 * @returns {Promise<Object[]>} - Le contenu du champ sous forme d'objets.
 */
export async function getFields(field, shopId) {
  console.log(`Étape 4 : Récupération du contenu du champ "${field}" pour le shop ID ${shopId}...`);

  // Ignorer les champs avec les labels "id" ou "shop_id"
  if (field === "id" || field === "shop_id" || field === "created_at" || field === "updated_at") {
    console.log(`Le champ "${field}" est ignoré.`);
    return [];
  }

  try {
    // Récupère les données du champ spécifié pour le shop donné
    const data = await fetchData(field, { match: { shop_id: shopId } });

    if (data.length === 0) {
      console.log(`Aucune donnée trouvée pour le champ "${field}" et le shop ID ${shopId}.`);
      return [];
    }

    console.log(`Contenu récupéré pour "${field}" :`, data);
    return data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du champ "${field}" pour le shop ID ${shopId} :`, error.message);
    throw error;
  }
}