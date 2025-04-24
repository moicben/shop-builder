import { runWithMultipleBrowsers } from '../utils/multiBrowser.js';

// filepath: C:/Users/bendo/Desktop/Documents/E-commerce/shop-builder/mano-mano/debugBrowser.js

(async () => {
  const tasks = [
    async (browser, page) => {

      // Naviguer vers une URL spécifique
      const url = 'https://www.manomano.fr/p/kit-de-construction-cabine-hammam-a-carreler-180-x-100-avec-generateur-vapeur-71131135'

      await page.goto(url, { waitUntil: 'networkidle2' });
      console.log('Navigated to:', url);

      // Attendre 10 secondes
      await new Promise((resolve) => setTimeout(resolve, 30000));
      console.log('Waited for 10 seconds');
    },
  ];

  try {
    // Exécuter la tâche avec 1 navigateur et 1 onglet
    const results = await runWithMultipleBrowsers(tasks, 1, 1);
    console.log('All tasks completed:', results);
  } catch (error) {
    console.error('Error running tasks:', error);
  }
})();