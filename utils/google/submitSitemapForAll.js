import { fetchData } from '../supabase.js';
import { submitSitemap } from './submitSitemap.js';
import { indexSite } from './indexSite.js';

async function submitSitemapsForAll() {
  try {
    // Fetch all shops from the "shops" table
    const shops = await fetchData('shops');
    console.log(`Found ${shops.length} shop(s) to process.`);

    for (const shop of shops) {
      if (shop.domain) {
        try {
          await submitSitemap(shop.domain);
        } catch (error) {
          console.error(`Error submitting sitemap for ${shop.domain}:`, error);
          // If the error code is 403, then fallback to indexSite()
          if (error.error && error.error.code === 403) {
            console.log(`Insufficient permission for sitemap submission on ${shop.domain}. Attempting indexSite() instead.`);
            try {
              await indexSite(shop.domain);
              console.log(`indexSite() succeeded for ${shop.domain}.`);
            } catch (indexError) {
              console.error(`Error indexing site for ${shop.domain}:`, indexError);
            }
          }
        }
      } else {
        console.log(`Skipping shop without domain:`, shop);
      }
    }
  } catch (error) {
    console.error('Error fetching shops:', error);
  }
}

submitSitemapsForAll();