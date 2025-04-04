// lib/supabase.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config(); // Assurez-vous d'avoir dotenv installé et configuré

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Crée une instance unique du client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Récupère les données d'une table donnée avec des options de requête.
 * @param {string} table - Le nom de la table à interroger (ex: "products", "categories", "content").
 * @param {Object} [options] - Options supplémentaires pour la requête.
 * @returns {Promise<Object[]>} - Les données récupérées.
 */
export async function fetchData(table, options = {}) {
  // On peut passer une sélection spécifique (ex: "id, title, description")
  const selectFields = options.select || "*";
  // On peut ajouter un filtre par match (ex: { id: 1 })
  const matchQuery = options.match || {};

  const { data, error } = await supabase
    .from(table)
    .select(selectFields)
    .match(matchQuery);

  if (error) {
    throw new Error(
      `Erreur lors de la récupération de ${table}: ${error.message}`
    );
  }

  return data;
}
