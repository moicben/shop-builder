import axios from 'axios';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { getAccessToken } from './getAccessToken.js';

dotenv.config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
const SCOPES = ['https://www.googleapis.com/auth/webmasters'];

// Création du client OAuth2 pour Search Console
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: await getAccessToken() });

const webmasters = google.webmasters({
  version: 'v3',
  auth: oauth2Client
});

export async function indexSite(domain) {
  // Remplacez par l'URL complète de votre site (inclure le protocole)
  const siteUrl = `https://${domain}`;
  
  //console.log('OAuth2 client initialized. Obtaining access token...');
  
  try {

    //console.log(`Adding site to Google Search Console: ${siteUrl}`);
    // Ajouter le site à Google Search Console
    await webmasters.sites.add({ siteUrl });
    //console.log(`Site added to Google Search Console: ${siteUrl}`);

    //console.log(`Submitting sitemap for indexing: ${siteUrl}/sitemap.xml`);
    // Soumettre le sitemap pour l'indexation
    await webmasters.sitemaps.submit({
        siteUrl,
        feedpath: `${siteUrl}/sitemap.xml`
      });

    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'access token :', error.response ? error.response.data : error.message);
  }
}

// const domain = 'test1.mano-mano.store'
// await indexSite(domain);