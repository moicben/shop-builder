import fs from "fs";
import { supabase } from "../supabase.js";

/**
 * Fonction pour récupérer le nombre de lignes d'une table
 */
export async function getCount(tableName) {
    const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
    if (error) {
        throw new Error(`Erreur lors du comptage de ${tableName}: ${error.message}`);
    }
    return count;
}