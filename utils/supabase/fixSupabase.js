import { fetchData } from "../supabase.js";

/**
 * Extrait les données JSON d'une colonne et les insère dans une nouvelle table.
 * @param {string} sourceTable - Nom de la table source.
 * @param {string} sourceColumn - Nom de la colonne JSON à extraire.
 * @param {string} targetTable - Nom de la table cible.
 * @param {Object} columnMapping - Mapping des colonnes (clé: colonne source, valeur: colonne cible).
 */
async function extractAndInsertData(sourceTable, sourceColumn, targetTable, columnMapping) {
  try {
    // Récupère les données de la colonne JSON
    const sourceData = await fetchData(sourceTable, { match: { shop_id: 1 } });

    if (!sourceData || sourceData.length === 0) {
      console.error("Aucune donnée trouvée dans la table source.");
      return;
    }

    console.log(`Données brutes : ${JSON.stringify(sourceData[0][sourceColumn])}`);

    // Transforme et insère les données dans la table cible
    const transformedData = sourceData
      .map((row) => {
        try {
          return JSON.parse(row[sourceColumn]); // Parse le JSON
        } catch (error) {
          console.error(`Erreur de parsing JSON pour la ligne : ${JSON.stringify(row)}`);
          return null;
        }
      })
      .filter((jsonData) => jsonData && jsonData.articles) // Filtre les données valides
      .flatMap((jsonData) => jsonData.articles) // Extrait les articles
      .map((article) => {
        const mappedData = {};
        for (const [sourceKey, targetKey] of Object.entries(columnMapping)) {
          mappedData[targetKey] = article[sourceKey];
        }
        return mappedData;
      });

    if (transformedData.length === 0) {
      console.error("Aucune donnée transformée à insérer.");
      return;
    }

    console.log(`Données transformées : ${JSON.stringify(transformedData)}`);

    const { error: insertError } = await supabase.from(targetTable).insert(transformedData);

    if (insertError) {
      throw new Error(`Erreur lors de l'insertion des données : ${insertError.message}`);
    }

    console.log(`Données insérées avec succès dans la table ${targetTable}`);
  } catch (error) {
    console.error(`Erreur : ${error.message}`);
  }
}

// Configuration pour reviewContent
const config = [
  {
    sourceColumn: "reviewContent",
    targetTable: "reviews",
    columnMapping: {
      id: "review_id",
      title: "review_title",
      content: "review_content",
    },
  },
];

// Exécution du script
(async () => {
  const sourceTable = "contents";

  for (const { sourceColumn, targetTable, columnMapping } of config) {
    await extractAndInsertData(sourceTable, sourceColumn, targetTable, columnMapping);
  }
})();