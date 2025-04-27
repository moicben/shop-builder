import { supabase } from "../supabase.js";

async function clearSupabase() {
  // Liste des tables à nettoyer (excluant "shops")
  const tables = ["posts", "contents", "products", "categories", "reviews", "brands"] 

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq("shop_id", 1); // Supprimer les lignes dont shop_id !== 1

    if (error) {
      console.error(`Erreur lors de la suppression dans la table "${table}": ${error.message}`);
    } else {
      console.log(`Suppression réussie dans la table "${table}"`);
    }
  }
}

clearSupabase();
