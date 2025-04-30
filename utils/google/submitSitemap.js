import { google } from 'googleapis';
import dotenv from 'dotenv';
import { getAccessToken } from './getAccessToken.js';

dotenv.config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

// Création du client OAuth2 pour Search Console
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Assurez-vous d'avoir un refresh token valide
oauth2Client.setCredentials({ refresh_token: await getAccessToken() });

const webmasters = google.webmasters({
  version: 'v3',
  auth: oauth2Client
});

export async function submitSitemap(domain) {
  const siteUrl = `https://${domain}`;
  try {
    console.log(`Submitting sitemap for: ${siteUrl}/sitemap.xml`);
    await webmasters.sitemaps.submit({
      siteUrl,
      feedpath: `${siteUrl}/sitemap.xml`
    });
    console.log(`Sitemap submitted successfully for: ${siteUrl}`);
  } catch (error) {
    console.error('Error submitting sitemap:', error.response ? error.response.data : error.message);
  }
}

// Exemple d'utilisation:
// (Remove or comment out the following lines in production)
// const testDomain = 'balance-de-cuisine.mano-mano.store';
// await submitSitemap(testDomain);