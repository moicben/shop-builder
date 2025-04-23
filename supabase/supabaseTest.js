import { fetchData } from "../utils/supabase.js"; // Assurez-vous que le chemin est correct

// test de console.log pour vérifier si le module est chargé correctement
console.log("Module supabase chargé.");


// Test de la fonction fetchData
async function testFetchData() {
  try {
    const products = await fetchData("products", {
      select: "id, title, desc",
      match: { shop_id: 1 },
    });
    console.log("Produits récupérés:", products);
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
  }
}

// Appel de la fonction de test
testFetchData()
  .then(() => console.log("Test terminé."))
  .catch((error) => console.error("Erreur dans le test:", error));