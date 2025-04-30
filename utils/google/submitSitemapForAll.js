import { fetchData } from '../supabase.js';
import { submitSitemap } from './submitSitemap.js';

async function submitSitemapsForAll() {
  try {
    // Fetch all shops from the "shops" table
    const shops = await fetchData('shops');

    console.log(`Found ${shops.length} shop(s) to process.`);

    for (const shop of shops) {
      if (shop.domain) {
        try {
          await submitSitemap(shop.domain);
          //console.log(`Sitemap submitted successfully for: ${shop.domain}`);
        } catch (error) {
          console.error(`Error submitting sitemap for ${shop.domain}:`, error);
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