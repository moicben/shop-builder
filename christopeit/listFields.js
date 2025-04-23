import { fetchData } from "../utils/supabase.js"

/**
 * Liste les champs de la boutique à traduire et récupère leurs contenus.
 * Les données sont organisées par table, puis par champ.
 * @param {number} templateShopId - L'ID du shop modèle.
 * @returns {Promise<Object>} - Un objet contenant les tables, les champs et leurs contenus.
 */
export async function listFieldsWithContents(templateShopId) {
  console.log(`Étape 3 : Récupération des champs et de leurs contenus pour le shop modèle ID ${templateShopId}...`);

  // Tables à traiter
  const tables = [ "products", "categories"]//, "posts", "contents", "reviews"];
  // Structure finale : { [table]: { [field]: [ { row1 }, { row2 }, ... ] } }
  const translatedData = {};

  // Liste des champs à exclure (noms exacts)
  const excludeFields = ["id", "shop_id", "created_at", "updated_at"];

  for (const table of tables) {
    console.log(`Récupération des champs pour la table : ${table}`);
    try {
      // Construire les options pour le fetchData
      const options = { select: "*", match: { shop_id: templateShopId } };
      if (table === "reviews") {
        options.limit = 4;
      }
      if (table === "posts") {
        options.limit = 2;
      }
      if (table === "products") {
        options.limit = 4;
      }
      // Récupère les lignes pour le shop modèle avec les éventuelles limites
      const tableData = await fetchData(table, options);
      console.log(`Nombre de lignes récupérées "${table}" : ${tableData.length}`);
      if (tableData.length > 0) {
        // Initialiser l'objet pour la table courante
        translatedData[table] = {};
        // Parcourir chaque ligne
        for (const row of tableData) {
          // Parcourir chaque champ (colonne) de la ligne
          for (const [field, value] of Object.entries(row)) {
            // Ignorer les champs non pertinents selon une liste de noms exacts
            if (excludeFields.includes(field)) {
              continue;
            }
            // Initialiser le tableau pour ce champ s'il n'existe pas encore dans la table
            if (!translatedData[table][field]) {
              translatedData[table][field] = [];
            }
            // Ajouter la ligne (ou seulement la valeur, selon vos besoins)
            translatedData[table][field].push({ ...row, value });
          }
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des champs pour la table "${table}" :`, error.message);
    }
  }

  console.log("Données traduisibles récupérées !");
  // Optionnel : afficher la structure pour vérification
  // console.log("Structure de translatedData :", JSON.stringify(translatedData, null, 2));
  return translatedData;
}