import OpenAI from 'openai';

// Définition du pattern pour exclure certains champs
const excludePattern = /(img|image|media|thumbnail|_id|price|discounted|bestseller)/i;

// Configurez votre clé API OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Traduit un contenu donné dans une locale cible.
 * Trois types de promptMessage sont utilisés en fonction de la condition :
 * 1. Pour le champ "slug" : retour d'un slug formaté.
 * 2. Si le contenu est un JSON (commence par “[”) : traduction en conservant le format JSON.
 * 3. Sinon : traduction classique.
 * Si le champ est exclu, la valeur d'origine est retournée.
 *
 * @param {string|object} content - Le contenu à traduire.
 * @param {string} targetLocale - La locale cible.
 * @param {string} fieldName - Le nom du champ.
 * @returns {Promise<string>} - Le contenu traduit.
 */
export async function translateContent(content, targetLocale, fieldName) {
  // Si le champ est exclu, retourner la valeur d'origine
  if (excludePattern.test(fieldName)) {
    console.log(`Le champ "${fieldName}" est exclu de traduction.`);
    return content;
  }

  try {
    // S'assurer que content est une chaîne de caractères
    if (typeof content !== 'string') {
      content = JSON.stringify(content);
    }
  
    let promptMessage;
    // 1. Condition spéciale pour le champ "slug"
    if (fieldName.toLowerCase() === "slug") {
      promptMessage = `Traduis le slug suivant en ${targetLocale} et retourne uniquement un slug (en minuscules, espaces remplacés par des tirets, sans caractères spéciaux)
      Voici le slug à traduire : ${content} \n
      Réponds uniquement avec le slug traduit, rien d'autre ! \n
      Voici le résultat du slug traduit : \n`;
    }
    // 2. Si le contenu est un JSON (commence par “[”)
    else if (content.trim().startsWith("[")) {
      promptMessage = `Traduis l'extrait JSON que vais te donner en ${targetLocale}, en conservant strictement le format JSON, sans ajouter ni modifier la structure \n
      Voici l'extrait JSON à traduire : ${content} \n
      Réponds uniquement avec l'extrait JSON traduit, rien d'autre !\n
      Voici le résultat de l'extrait JSON traduit : \n`;
    }
    // 3. Translation classique
    else {
      promptMessage = `Traduis le texte que je vais te donner en ${targetLocale}. \n
      Voici le texte à traduire : ${content} \n
      Réponds uniquement avec le texte traduit, rien d'autre ! \n
      Voici le résultat du texte traduit : \n`;
    }
    
    // Appel unique à OpenAI avec le promptMessage construit
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Tu es un assistant de traduction de contenu e-commerce.' },
        { role: 'user', content: promptMessage }
      ],
    });
    
    const translatedContent = response.choices[0].message.content.trim().replace('Here is the translated text:', '');
    console.log(`--> (${targetLocale}) pour champ "${fieldName}" :`, translatedContent);
    return translatedContent;
  } catch (error) {
    console.error("Erreur lors de la traduction :", error.message);
    throw error;
  }
}